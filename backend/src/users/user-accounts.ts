import { UserRole, UserStatus } from './user.enums';

/**
 * Cuenta tal como la necesita Auth para autenticar. No es la entidad de base de datos: solo
 * lleva los datos de identidad y acceso (sin XP, créditos, etc.).
 */
export interface UserAccount {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  /** Null si la cuenta se creó solo con Google. */
  passwordHash: string | null;
  googleId: string | null;
}

export interface NewUserData {
  username: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  referredById?: string | null;
}

/**
 * Interfaz pública de Users para Auth (Arquitectura §3): buscar y crear cuentas y cambiar sus
 * credenciales. Auth depende de esta abstracción, no de UsersService (inversión de dependencias).
 */
export abstract class UserAccounts {
  abstract findById(id: string): Promise<UserAccount | null>;
  abstract findByEmail(email: string): Promise<UserAccount | null>;
  /** Sin distinguir mayúsculas. */
  abstract findByUsername(username: string): Promise<UserAccount | null>;
  abstract findByGoogleId(googleId: string): Promise<UserAccount | null>;
  /** Crea una cuenta de jugador. 409 si el email o el username ya existen. */
  abstract create(data: NewUserData): Promise<UserAccount>;
  abstract linkGoogleAccount(userId: string, googleId: string): Promise<void>;
  abstract updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
  /** Username disponible a partir de un texto base (ej. el nombre de Google). */
  abstract generateAvailableUsername(base: string): Promise<string>;
}
