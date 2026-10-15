import { CreditReason, CreditTransaction } from '../entities/credit-transaction.entity';

/** Repositorio del libro contable de créditos (CREDIT_TRANSACTION). */
export abstract class CreditTransactionsRepository {
  /**
   * Procesa de a uno los movimientos de un mismo usuario hasta el final de la transacción
   * (usar dentro de UnitOfWork.run). No bloquea tablas de otros módulos.
   */
  abstract lockAccount(userId: string): Promise<void>;
  /** Del más reciente al más antiguo. */
  abstract listByUser(userId: string, page: number, limit: number): Promise<{ rows: CreditTransaction[]; total: number }>;
  /** Registra una recompensa. false si esa recompensa (motivo + referencia) ya se había pagado. */
  abstract insertRewardOnce(reward: { userId: string; amount: number; reason: CreditReason; referenceId: string | null }): Promise<boolean>;
  abstract insertSpend(spend: { userId: string; amount: number; reason: CreditReason; referenceId: string }): Promise<void>;
}
