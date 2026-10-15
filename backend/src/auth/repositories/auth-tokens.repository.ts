import { AuthToken, AuthTokenType } from '../entities/auth-token.entity';

/** Repositorio de AUTH_TOKEN (refresh tokens y tokens de recuperación, guardados como hash). */
export abstract class AuthTokensRepository {
  abstract insert(token: { userId: string; type: AuthTokenType; tokenHash: string; expiresAt: Date }): Promise<void>;
  abstract findByHash(tokenHash: string, type: AuthTokenType): Promise<AuthToken | null>;
  /** Revoca el token solo si sigue activo. Devuelve si lo revocó (si dos peticiones lo usan a la vez, solo una gana). */
  abstract revokeIfActive(id: string): Promise<boolean>;
  abstract revokeByHash(tokenHash: string, type: AuthTokenType): Promise<void>;
  abstract revokeAllOfUser(userId: string, type: AuthTokenType): Promise<void>;
  /** Revoca un token vigente y devuelve su dueño; null si no existe, venció o ya se usó. */
  abstract consumeValid(tokenHash: string, type: AuthTokenType): Promise<string | null>;
}
