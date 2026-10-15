import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { CheckConstraintError, UniqueConstraintError } from './errors';
import { UnitOfWork } from './unit-of-work';

/** Transacción abierta en el flujo asíncrono actual (una por petición o evento). */
const transactionContext = new AsyncLocalStorage<EntityManager>();

/** UnitOfWork sobre TypeORM: guarda la transacción en el contexto asíncrono. */
@Injectable()
export class TypeOrmUnitOfWork extends UnitOfWork {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    if (transactionContext.getStore()) return work();
    return this.dataSource.transaction((manager) => transactionContext.run(manager, work));
  }
}

/**
 * Base de los repositorios TypeORM: `manager` es la transacción abierta por UnitOfWork, o
 * la conexión normal si no hay ninguna. Así un repositorio participa en la transacción sin
 * que el servicio le pase nada.
 */
export abstract class TypeOrmRepository {
  constructor(private readonly dataSource: DataSource) {}

  protected get manager(): EntityManager {
    return transactionContext.getStore() ?? this.dataSource.manager;
  }

  /** Filas de un UPDATE … RETURNING (TypeORM devuelve [filas, cantidad] en PostgreSQL). */
  protected async updateReturning<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown[] = await this.manager.query(sql, params);
    return (Array.isArray(result[0]) ? result[0] : result) as T[];
  }

  /**
   * Bloqueo por clave hasta el final de la transacción actual (debe llamarse dentro de
   * UnitOfWork.run). Sirve para procesar de a una las operaciones de un mismo usuario sin
   * bloquear filas de tablas de otro módulo.
   */
  protected async lockKey(key: string): Promise<void> {
    await this.manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
  }

  /** Traduce los errores del motor a errores de dominio. */
  protected async translateErrors<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const code = error instanceof QueryFailedError ? (error.driverError as { code?: string }).code : undefined;
      if (code === '23505') throw new UniqueConstraintError();
      if (code === '23514') throw new CheckConstraintError();
      throw error;
    }
  }
}
