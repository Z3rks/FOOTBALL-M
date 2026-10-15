import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { AuthTokenType } from './entities/auth-token.entity';
import { AuthTokensRepository } from './repositories/auth-tokens.repository';

export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const newOpaqueToken = () => randomBytes(32).toString('base64url');

/**
 * Refresh tokens y tokens de recuperación de contraseña (tabla AUTH_TOKEN).
 * Solo se guarda el hash SHA-256; el token en claro existe únicamente en la cookie o el correo.
 */
@Injectable()
export class AuthTokensService {
  private readonly logger = new Logger(AuthTokensService.name);
  private readonly refreshDays: number;
  private readonly resetMinutes: number;

  constructor(
    private readonly tokens: AuthTokensRepository,
    config: ConfigService,
  ) {
    this.refreshDays = Number(config.get('REFRESH_TOKEN_DAYS'));
    this.resetMinutes = Number(config.get('PASSWORD_RESET_MINUTES'));
  }

  issueRefreshToken(userId: string): Promise<IssuedToken> {
    return this.issue(userId, AuthTokenType.REFRESH, this.refreshDays * 24 * 60);
  }

  /**
   * Valida un refresh token y lo reemplaza por uno nuevo (rotación). Si alguien presenta un
   * token ya revocado, se asume robo y se revocan todas las sesiones del usuario.
   */
  async rotateRefreshToken(token: string): Promise<{ userId: string; next: IssuedToken }> {
    const stored = await this.tokens.findByHash(hash(token), AuthTokenType.REFRESH);
    if (!stored) throw new UnauthorizedException('Invalid session');

    if (stored.revokedAt) {
      this.logger.warn(`Refresh token reutilizado para el usuario ${stored.userId}; se revocan todas sus sesiones`);
      await this.revokeAllRefreshTokens(stored.userId);
      throw new UnauthorizedException('Invalid session');
    }
    if (stored.expiresAt <= new Date()) throw new UnauthorizedException('Session expired');

    // Revocación condicional: si dos peticiones usan el mismo token a la vez, solo una gana.
    if (!(await this.tokens.revokeIfActive(stored.id))) throw new UnauthorizedException('Invalid session');

    return { userId: stored.userId, next: await this.issueRefreshToken(stored.userId) };
  }

  /** Cierra una sesión. No falla si el token no existe o ya estaba revocado (idempotente). */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.tokens.revokeByHash(hash(token), AuthTokenType.REFRESH);
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.tokens.revokeAllOfUser(userId, AuthTokenType.REFRESH);
  }

  /** Emite un token de recuperación de un solo uso e invalida los anteriores del mismo usuario. */
  async issuePasswordResetToken(userId: string): Promise<IssuedToken> {
    await this.tokens.revokeAllOfUser(userId, AuthTokenType.PASSWORD_RESET);
    return this.issue(userId, AuthTokenType.PASSWORD_RESET, this.resetMinutes);
  }

  /** Marca el token de recuperación como usado y devuelve el usuario dueño. 400 si no es válido. */
  async consumePasswordResetToken(token: string): Promise<string> {
    const userId = await this.tokens.consumeValid(hash(token), AuthTokenType.PASSWORD_RESET);
    if (!userId) throw new BadRequestException('Invalid or expired token');
    return userId;
  }

  private async issue(userId: string, type: AuthTokenType, minutes: number): Promise<IssuedToken> {
    const token = newOpaqueToken();
    const expiresAt = new Date(Date.now() + minutes * 60_000);
    await this.tokens.insert({ userId, type, tokenHash: hash(token), expiresAt });
    return { token, expiresAt };
  }
}
