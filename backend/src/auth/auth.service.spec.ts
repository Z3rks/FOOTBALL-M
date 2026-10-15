import { BadRequestException, ConflictException, ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcryptjs';
import { AdminActionEvent, DomainEvents, UserRegisteredEvent } from '../shared/events/domain-events';
import { UserAccount, UserAccounts } from '../users/user-accounts';
import { UserRole, UserStatus } from '../users/user.enums';
import { GoogleProfile, GoogleVerifier } from './adapters/google-verifier';
import { MailSender } from './adapters/mail-sender';
import { AuthTokensService } from './auth-tokens.service';
import { AuthService } from './auth.service';

const PASSWORD = 'supersecreta1';
const PASSWORD_HASH = hashSync(PASSWORD, 10);

function makeUser(overrides: Partial<UserAccount> = {}): UserAccount {
  return {
    id: 'user-1',
    username: 'fan123',
    email: 'fan@example.com',
    passwordHash: PASSWORD_HASH,
    googleId: null,
    role: UserRole.PLAYER,
    status: UserStatus.ACTIVE,
    ...overrides,
  } as UserAccount;
}

describe('AuthService', () => {
  let users: jest.Mocked<UserAccounts>;
  let tokens: jest.Mocked<AuthTokensService>;
  let google: jest.Mocked<GoogleVerifier>;
  let mail: jest.Mocked<MailSender>;
  let events: { emit: jest.Mock; emitAsync: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findByUsername: jest.fn().mockResolvedValue(null),
      findByGoogleId: jest.fn().mockResolvedValue(null),
      create: jest.fn(async (data) => makeUser({ ...data, id: 'new-user' } as Partial<UserAccount>)),
      linkGoogleAccount: jest.fn(),
      updatePasswordHash: jest.fn(),
      generateAvailableUsername: jest.fn().mockResolvedValue('Juan_Perez'),
    } as unknown as jest.Mocked<UserAccounts>;
    tokens = {
      issueRefreshToken: jest.fn().mockResolvedValue({ token: 'refresh-token', expiresAt: new Date() }),
      rotateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllRefreshTokens: jest.fn(),
      issuePasswordResetToken: jest.fn().mockResolvedValue({ token: 'reset-token', expiresAt: new Date() }),
      consumePasswordResetToken: jest.fn(),
    } as unknown as jest.Mocked<AuthTokensService>;
    google = { verify: jest.fn() } as unknown as jest.Mocked<GoogleVerifier>;
    mail = { sendPasswordReset: jest.fn() } as unknown as jest.Mocked<MailSender>;
    events = { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue([]) };
    const config = new ConfigService({ BCRYPT_COST: 10, JWT_EXPIRES_IN: '15m', FRONTEND_URL: 'http://localhost:5173' });
    const jwt = new JwtService({ secret: 'x'.repeat(32) });
    service = new AuthService(users, tokens, jwt, google, mail, events as unknown as EventEmitter2, config);
  });

  describe('register', () => {
    const dto = { username: 'fan123', email: 'fan@example.com', password: PASSWORD, consentAccepted: true };

    it('crea la cuenta con la contraseña cifrada, emite UserRegisteredEvent e inicia sesión', async () => {
      const session = await service.register(dto);

      const created = users.create.mock.calls[0][0];
      expect(created.passwordHash).not.toBe(PASSWORD);
      expect(created.passwordHash).toMatch(/^\$2[aby]\$10\$/);
      expect(events.emitAsync).toHaveBeenCalledWith(DomainEvents.USER_REGISTERED, new UserRegisteredEvent('new-user', null));
      expect(session).toMatchObject({ expiresIn: 900, refreshToken: 'refresh-token', user: { id: 'new-user', role: UserRole.PLAYER } });
      expect(session.accessToken).toEqual(expect.any(String));
    });

    it('responde 409 si el email ya está registrado', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('guarda quién lo refirió cuando el código es válido', async () => {
      users.findByUsername.mockImplementation(async (name) => (name === 'amigo' ? makeUser({ id: 'referrer' }) : null));
      await service.register({ ...dto, referralCode: 'amigo' });
      expect(users.create.mock.calls[0][0].referredById).toBe('referrer');
    });

    it('responde 400 si el código de referido no existe', async () => {
      await expect(service.register({ ...dto, referralCode: 'nadie' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('login', () => {
    it('TC-05: inicia sesión de un jugador con credenciales válidas, sin auditoría', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      const session = await service.login({ email: 'fan@example.com', password: PASSWORD, role: UserRole.PLAYER }, '1.1.1.1');
      expect(session.user.role).toBe(UserRole.PLAYER);
      expect(events.emitAsync).not.toHaveBeenCalled();
    });

    it('TC-06: el login de un administrador queda auditado', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ id: 'admin-1', role: UserRole.ADMIN }));
      await service.login({ email: 'fan@example.com', password: PASSWORD, role: UserRole.ADMIN }, '1.1.1.1');
      expect(events.emitAsync).toHaveBeenCalledWith(DomainEvents.ADMIN_ACTION, new AdminActionEvent('admin-1', 'Admin login', '1.1.1.1'));
    });

    it('TC-07: responde 401 con contraseña incorrecta', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      await expect(service.login({ email: 'fan@example.com', password: 'otra', role: UserRole.PLAYER }, 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('responde el mismo 401 si el email no existe (no revela cuentas)', async () => {
      await expect(service.login({ email: 'nadie@example.com', password: PASSWORD, role: UserRole.PLAYER }, 'ip')).rejects.toThrow('Invalid email or password');
    });

    it('responde 401 si la cuenta no tiene contraseña (creada con Google)', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ passwordHash: null }));
      await expect(service.login({ email: 'fan@example.com', password: PASSWORD, role: UserRole.PLAYER }, 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('RNF-SEC-03: responde 403 si el rol elegido no es el real', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      await expect(service.login({ email: 'fan@example.com', password: PASSWORD, role: UserRole.ADMIN }, 'ip')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('TC-47: una cuenta suspendida no puede iniciar sesión', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ status: UserStatus.INACTIVE }));
      await expect(service.login({ email: 'fan@example.com', password: PASSWORD, role: UserRole.PLAYER }, 'ip')).rejects.toThrow('Account suspended');
      expect(tokens.issueRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('authenticateWithGoogle', () => {
    const profile: GoogleProfile = { googleId: 'g-1', email: 'fan@example.com', emailVerified: true, name: 'Juan Pérez' };

    it('inicia sesión si la cuenta de Google ya está vinculada', async () => {
      google.verify.mockResolvedValue(profile);
      users.findByGoogleId.mockResolvedValue(makeUser({ googleId: 'g-1' }));
      await expect(service.authenticateWithGoogle({ idToken: 't' })).resolves.toMatchObject({ user: { id: 'user-1' } });
      expect(users.create).not.toHaveBeenCalled();
    });

    it('vincula Google a una cuenta existente con el mismo email verificado', async () => {
      google.verify.mockResolvedValue(profile);
      users.findByEmail.mockResolvedValue(makeUser());
      await service.authenticateWithGoogle({ idToken: 't' });
      expect(users.linkGoogleAccount).toHaveBeenCalledWith('user-1', 'g-1');
    });

    it('no vincula si Google no verificó el email', async () => {
      google.verify.mockResolvedValue({ ...profile, emailVerified: false });
      users.findByEmail.mockResolvedValue(makeUser());
      await expect(service.authenticateWithGoogle({ idToken: 't' })).rejects.toBeInstanceOf(UnauthorizedException);
      expect(users.linkGoogleAccount).not.toHaveBeenCalled();
    });

    it('RF-022: crea la cuenta si no existe y hay consentimiento', async () => {
      google.verify.mockResolvedValue(profile);
      await service.authenticateWithGoogle({ idToken: 't', consentAccepted: true });
      expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ username: 'Juan_Perez', email: 'fan@example.com', googleId: 'g-1' }));
      expect(events.emitAsync).toHaveBeenCalledWith(DomainEvents.USER_REGISTERED, expect.any(UserRegisteredEvent));
    });

    it('Ley 1581: no crea la cuenta sin consentimiento', async () => {
      google.verify.mockResolvedValue(profile);
      await expect(service.authenticateWithGoogle({ idToken: 't' })).rejects.toBeInstanceOf(BadRequestException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('RF-032: un administrador no puede entrar con Google', async () => {
      google.verify.mockResolvedValue(profile);
      users.findByGoogleId.mockResolvedValue(makeUser({ role: UserRole.ADMIN }));
      await expect(service.authenticateWithGoogle({ idToken: 't' })).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('refresh y logout', () => {
    it('emite un access token nuevo y rota el refresh token', async () => {
      tokens.rotateRefreshToken.mockResolvedValue({ userId: 'user-1', next: { token: 'nuevo', expiresAt: new Date() } });
      users.findById.mockResolvedValue(makeUser());
      await expect(service.refresh('viejo')).resolves.toMatchObject({ refreshToken: 'nuevo', user: { id: 'user-1' } });
    });

    it('responde 401 si no hay cookie de sesión', async () => {
      await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('RNF-SEC-05: logout revoca el refresh token en el servidor', async () => {
      await service.logout('refresh-token');
      expect(tokens.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('recuperación de contraseña', () => {
    it('envía el enlace de recuperación a una cuenta activa', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      await service.forgotPassword('fan@example.com');
      expect(mail.sendPasswordReset).toHaveBeenCalledWith('fan@example.com', 'http://localhost:5173/reset-password?token=reset-token', 'en');
      await service.forgotPassword('fan@example.com', 'es');
      expect(mail.sendPasswordReset).toHaveBeenLastCalledWith('fan@example.com', 'http://localhost:5173/reset-password?token=reset-token', 'es');
    });

    it('si el proveedor de correo falla, responde igual (no revela que el email existe)', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      mail.sendPasswordReset.mockRejectedValue(new Error('Brevo respondió 401'));
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      await expect(service.forgotPassword('fan@example.com')).resolves.toBeUndefined();
    });

    it('no envía nada si el email no existe, sin lanzar error', async () => {
      await expect(service.forgotPassword('nadie@example.com')).resolves.toBeUndefined();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('cambia la contraseña y cierra todas las sesiones', async () => {
      tokens.consumePasswordResetToken.mockResolvedValue('user-1');
      await service.resetPassword('reset-token', 'nuevaClave123');
      expect(users.updatePasswordHash).toHaveBeenCalledWith('user-1', expect.stringMatching(/^\$2[aby]\$10\$/));
      expect(tokens.revokeAllRefreshTokens).toHaveBeenCalledWith('user-1');
    });
  });
});
