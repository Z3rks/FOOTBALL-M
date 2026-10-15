import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { compare, hash, hashSync } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { AdminActionEvent, DomainEvents, UserRegisteredEvent } from '../shared/events/domain-events';
import { UserAccount, UserAccounts } from '../users/user-accounts';
import { UserRole, UserStatus } from '../users/user.enums';
import { GoogleVerifier } from './adapters/google-verifier';
import { DEFAULT_LOCALE, Locale } from '../shared/i18n/locale';
import { MailSender } from './adapters/mail-sender';
import { AuthTokensService } from './auth-tokens.service';
import { durationToSeconds } from './duration';
import { GoogleAuthDto, LoginDto, RegisterDto } from './dto/auth.dto';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

/** Lo que el controlador necesita para responder: cuerpo JSON + refresh token para la cookie. */
export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  user: { id: string; username: string; role: UserRole };
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly bcryptCost: number;
  /** Hash de una contraseña aleatoria; se compara cuando el email no existe, para igualar tiempos. */
  private readonly dummyHash: string;
  private readonly accessTokenSeconds: number;
  private readonly frontendUrl: string;

  constructor(
    private readonly users: UserAccounts,
    private readonly tokens: AuthTokensService,
    private readonly jwt: JwtService,
    private readonly google: GoogleVerifier,
    private readonly mail: MailSender,
    private readonly events: EventEmitter2,
    config: ConfigService,
  ) {
    this.bcryptCost = Number(config.get('BCRYPT_COST'));
    this.dummyHash = hashSync(randomBytes(16).toString('hex'), this.bcryptCost);
    this.accessTokenSeconds = durationToSeconds(config.getOrThrow<string>('JWT_EXPIRES_IN'));
    this.frontendUrl = config.getOrThrow<string>('FRONTEND_URL');
  }

  /** RF-040 a RF-044. Crea una cuenta de jugador e inicia sesión. */
  async register(dto: RegisterDto): Promise<AuthSession> {
    if (await this.users.findByEmail(dto.email)) throw new ConflictException('Email already registered');
    if (await this.users.findByUsername(dto.username)) throw new ConflictException('Username already taken');
    const referredById = await this.resolveReferral(dto.referralCode);

    const user = await this.users.create({
      username: dto.username,
      email: dto.email,
      passwordHash: await hash(dto.password, this.bcryptCost),
      referredById,
    });
    await this.events.emitAsync(DomainEvents.USER_REGISTERED, new UserRegisteredEvent(user.id, referredById));
    return this.createSession(user);
  }

  /** RF-025 a RF-034. Valida credenciales, el rol elegido en el toggle y que la cuenta esté activa. */
  async login(dto: LoginDto, ipAddress: string): Promise<AuthSession> {
    const user = await this.users.findByEmail(dto.email);
    // Siempre se ejecuta bcrypt, exista o no el email, para no revelar cuentas por el tiempo de respuesta.
    const passwordOk = await compare(dto.password, user?.passwordHash ?? this.dummyHash);
    if (!user || !user.passwordHash || !passwordOk) throw new UnauthorizedException('Invalid email or password');

    this.assertActive(user);
    if (user.role !== dto.role) throw new ForbiddenException('This account cannot use the selected access type');

    if (user.role === UserRole.ADMIN) {
      // RNF-SEC-04: si no se puede auditar el acceso, no se permite el login de administrador.
      await this.events.emitAsync(DomainEvents.ADMIN_ACTION, new AdminActionEvent(user.id, 'Admin login', ipAddress));
    }
    return this.createSession(user);
  }

  /**
   * RF-020 a RF-024 y RF-050 a RF-054. Inicia sesión con Google; si la cuenta no existe la crea
   * (exige consentAccepted). Solo para jugadores: el modo Admin no ofrece Google (RF-032).
   */
  async authenticateWithGoogle(dto: GoogleAuthDto): Promise<AuthSession> {
    const profile = await this.google.verify(dto.idToken);

    let user = await this.users.findByGoogleId(profile.googleId);
    if (!user) {
      const byEmail = await this.users.findByEmail(profile.email);
      if (byEmail) {
        // Solo se vincula si Google confirma que el correo es de quien inicia sesión.
        if (!profile.emailVerified) throw new UnauthorizedException('Google email is not verified');
        await this.users.linkGoogleAccount(byEmail.id, profile.googleId);
        user = byEmail;
      }
    }

    if (!user) {
      if (dto.consentAccepted !== true) throw new BadRequestException('consentAccepted must be true to create an account');
      const referredById = await this.resolveReferral(dto.referralCode);
      user = await this.users.create({
        username: await this.users.generateAvailableUsername(profile.name ?? profile.email.split('@')[0]),
        email: profile.email,
        googleId: profile.googleId,
        referredById,
      });
      await this.events.emitAsync(DomainEvents.USER_REGISTERED, new UserRegisteredEvent(user.id, referredById));
    }

    this.assertActive(user);
    if (user.role !== UserRole.PLAYER) throw new ForbiddenException('Administrators must sign in with email and password');
    return this.createSession(user);
  }

  /** Emite un access token nuevo a partir del refresh token de la cookie, y rota el refresh token. */
  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) throw new UnauthorizedException('No active session');
    const { userId, next } = await this.tokens.rotateRefreshToken(refreshToken);
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid session');
    this.assertActive(user);
    return { ...this.buildAccess(user), refreshToken: next.token, refreshExpiresAt: next.expiresAt };
  }

  /** RF-111, RF-113, RF-124. Revoca el refresh token en el servidor (RNF-SEC-05). */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.tokens.revokeRefreshToken(refreshToken);
  }

  /**
   * RF-035 a RF-039. No revela si el email existe: siempre termina igual para quien llama. El
   * correo va en el idioma en que se pidió.
   */
  async forgotPassword(email: string, locale: Locale = DEFAULT_LOCALE): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.status !== UserStatus.ACTIVE) return;
    const { token } = await this.tokens.issuePasswordResetToken(user.id);
    try {
      await this.mail.sendPasswordReset(user.email, `${this.frontendUrl}/reset-password?token=${token}`, locale);
    } catch (error) {
      // Se registra pero no se propaga: un error solo con emails existentes revelaría cuáles lo son.
      this.logger.error(`No se pudo enviar el correo de recuperación al usuario ${user.id}`, error as Error);
    }
  }

  /** RF-035 a RF-039. Cambia la contraseña y cierra todas las sesiones abiertas. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.tokens.consumePasswordResetToken(token);
    await this.users.updatePasswordHash(userId, await hash(newPassword, this.bcryptCost));
    await this.tokens.revokeAllRefreshTokens(userId);
  }

  private async createSession(user: UserAccount): Promise<AuthSession> {
    const refresh = await this.tokens.issueRefreshToken(user.id);
    return { ...this.buildAccess(user), refreshToken: refresh.token, refreshExpiresAt: refresh.expiresAt };
  }

  private buildAccess(user: UserAccount): Pick<AuthSession, 'accessToken' | 'expiresIn' | 'user'> {
    const payload: AccessTokenPayload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      expiresIn: this.accessTokenSeconds,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }

  /** Cuentas suspendidas no pueden iniciar sesión (RF-135, TC-47). */
  private assertActive(user: UserAccount): void {
    if (user.status !== UserStatus.ACTIVE) throw new ForbiddenException('Account suspended');
  }

  private async resolveReferral(referralCode?: string): Promise<string | null> {
    if (!referralCode) return null;
    const referrer = await this.users.findByUsername(referralCode);
    if (!referrer) throw new BadRequestException('Invalid referral code');
    return referrer.id;
  }
}
