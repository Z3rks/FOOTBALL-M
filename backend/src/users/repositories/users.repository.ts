import { User } from '../entities/user.entity';
import { UserRole } from '../user.enums';

export interface NewUserRecord {
  username: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  referredById: string | null;
  role: UserRole;
  consentAcceptedAt: Date;
}

/** Campos de USER que se pueden modificar (el saldo de créditos solo cambia con addCreditsBalance). */
export type UserChanges = Partial<
  Pick<User, 'username' | 'country' | 'status' | 'googleId' | 'passwordHash' | 'xpTotal' | 'level' | 'streakDays' | 'lastPlayedOn' | 'accuracy'>
>;

/** Repositorio de la tabla USER (patrón Repository, Arquitectura §6). */
export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  /** Sin distinguir mayúsculas. */
  abstract findByUsername(username: string): Promise<User | null>;
  abstract findByGoogleId(googleId: string): Promise<User | null>;
  /** Lanza UniqueConstraintError si el email o el username ya existen. */
  abstract create(data: NewUserRecord): Promise<User>;
  /** Lanza UniqueConstraintError si el nuevo username ya existe. */
  abstract update(id: string, changes: UserChanges): Promise<void>;
  abstract delete(id: string): Promise<void>;
  /** Lee el usuario y lo bloquea hasta el final de la transacción (usar dentro de UnitOfWork.run). */
  abstract findByIdForUpdate(id: string): Promise<User | null>;
  /**
   * Suma `delta` (o resta, si es negativo) al saldo y devuelve el nuevo. null si el usuario no
   * existe; CheckConstraintError si el saldo quedaría negativo.
   */
  abstract addCreditsBalance(id: string, delta: number): Promise<number | null>;
}
