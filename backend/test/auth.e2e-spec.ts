import { UnauthorizedException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AdminAuditLog } from '../src/admin/audit/entities/admin-audit-log.entity';
import { GoogleProfile, GoogleVerifier } from '../src/auth/adapters/google-verifier';
import { MailSender } from '../src/auth/adapters/mail-sender';
import { User, UserRole, UserStatus } from '../src/users/entities/user.entity';
import { createTestApp, deleteE2eUsers, E2E_DOMAIN, E2E_PASSWORD, RUN_ID } from './utils';

/**
 * Pruebas de extremo a extremo del módulo Auth contra PostgreSQL real (npm run db:up).
 * Solo se reemplazan los servicios externos: el correo (se captura el enlace) y Google.
 * Todos los usuarios de prueba usan el dominio @e2e.test y se borran al final.
 */
const DOMAIN = E2E_DOMAIN;
const RUN = RUN_ID;
const PASSWORD = E2E_PASSWORD;

const sentMails: Array<{ to: string; url: string; locale: string }> = [];
const fakeMail: MailSender = { sendPasswordReset: async (to, url, locale) => void sentMails.push({ to, url, locale }) };
const googleProfiles = new Map<string, GoogleProfile>();
const fakeGoogle: GoogleVerifier = {
  verify: async (idToken) => {
    const profile = googleProfiles.get(idToken);
    if (!profile) throw new UnauthorizedException('Invalid Google token');
    return profile;
  },
};

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  let ipCounter = 0;
  /** IP única por petición/prueba, para que el rate limiting de una prueba no afecte a otra. */
  const newIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;
  const email = (name: string) => `${name}.${RUN}${DOMAIN}`;
  const username = (name: string) => `${name}_${RUN}`.slice(0, 30);

  const register = (name: string, ip = newIp()) =>
    request(app.getHttpServer())
      .post('/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ username: username(name), email: email(name), password: PASSWORD, consentAccepted: true });

  const login = (userEmail: string, password: string, role: UserRole, ip = newIp()) =>
    request(app.getHttpServer()).post('/v1/auth/login').set('X-Forwarded-For', ip).send({ email: userEmail, password, role });

  const refreshCookie = (res: request.Response) =>
    ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='))!;

  beforeAll(async () => {
    ({ app, db } = await createTestApp((builder) =>
      builder.overrideProvider(MailSender).useValue(fakeMail).overrideProvider(GoogleVerifier).useValue(fakeGoogle),
    ));
  });

  afterAll(async () => {
    await deleteE2eUsers(db);
    await app.close();
  });

  describe('registro', () => {
    it('TC-08: crea la cuenta, devuelve el access token y pone el refresh token en una cookie httpOnly', async () => {
      const res = await register('registro').expect(201);

      expect(res.body).toEqual({ accessToken: expect.any(String), expiresIn: 900, user: { id: expect.any(String), username: username('registro'), role: 'player' } });
      expect(res.body).not.toHaveProperty('refreshToken');
      const cookie = refreshCookie(res);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/Path=\/v1\/auth/);
      expect(cookie).toMatch(/SameSite=Strict/);

      const stored = await db.getRepository(User).findOneByOrFail({ email: email('registro') });
      expect(stored.passwordHash).not.toBe(PASSWORD);
      expect(stored.consentAcceptedAt).toBeInstanceOf(Date);
    });

    it('responde 409 si el email ya existe', async () => {
      await register('duplicado').expect(201);
      await register('duplicado').expect(409);
    });

    it('TC-10: responde 400 si falta el email', () => {
      return request(app.getHttpServer()).post('/v1/auth/register').set('X-Forwarded-For', newIp()).send({ username: username('sinemail'), password: PASSWORD, consentAccepted: true }).expect(400);
    });

    it('TC-35: rechaza un script en el nombre de usuario', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .set('X-Forwarded-For', newIp())
        .send({ username: '<script>alert(1)</script>', email: email('xss'), password: PASSWORD, consentAccepted: true })
        .expect(400);
    });

    it('RNF-SEC-07: exige aceptar la política de datos', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .set('X-Forwarded-For', newIp())
        .send({ username: username('sinconsent'), email: email('sinconsent'), password: PASSWORD, consentAccepted: false })
        .expect(400);
    });
  });

  describe('login', () => {
    beforeAll(async () => {
      await register('jugador');
      await db.getRepository(User).insert({
        email: email('admin'),
        username: username('admin'),
        passwordHash: hashSync(PASSWORD, 10),
        role: UserRole.ADMIN,
        consentAcceptedAt: new Date(),
      });
    });

    it('TC-05: un jugador inicia sesión con credenciales válidas', async () => {
      const res = await login(email('jugador'), PASSWORD, UserRole.PLAYER).expect(200);
      expect(res.body.user.role).toBe('player');
      expect(refreshCookie(res)).toBeDefined();
    });

    it('TC-06: un administrador inicia sesión y el acceso queda en ADMIN_AUDIT_LOG', async () => {
      const ip = newIp();
      const res = await login(email('admin'), PASSWORD, UserRole.ADMIN, ip).expect(200);
      expect(res.body.user.role).toBe('admin');

      const log = await db.getRepository(AdminAuditLog).findOneBy({ adminUserId: res.body.user.id, action: 'Admin login' });
      expect(log).toMatchObject({ ipAddress: ip });
    });

    it('TC-07: responde 401 con contraseña incorrecta', () => {
      return login(email('jugador'), 'incorrecta', UserRole.PLAYER).expect(401);
    });

    it('RNF-SEC-03: un jugador no puede entrar eligiendo el acceso Admin', () => {
      return login(email('jugador'), PASSWORD, UserRole.ADMIN).expect(403);
    });

    it('rechaza campos no declarados en el cuerpo', () => {
      return request(app.getHttpServer()).post('/v1/auth/login').set('X-Forwarded-For', newIp()).send({ email: email('jugador'), password: PASSWORD, role: 'player', isAdmin: true }).expect(400);
    });

    it('TC-44: el sexto intento de login desde la misma IP en 15 minutos responde 429', async () => {
      const ip = newIp();
      for (let i = 0; i < 5; i++) await login(email('jugador'), 'incorrecta', UserRole.PLAYER, ip).expect(401);
      await login(email('jugador'), PASSWORD, UserRole.PLAYER, ip).expect(429);
    });

    it('TC-47: una cuenta suspendida no puede iniciar sesión', async () => {
      await register('suspendido');
      await db.getRepository(User).update({ email: email('suspendido') }, { status: UserStatus.INACTIVE });
      const res = await login(email('suspendido'), PASSWORD, UserRole.PLAYER).expect(403);
      expect(res.body.message).toBe('Account suspended');
      expect(res.headers['set-cookie']).toBeUndefined();
    });
  });

  describe('sesión: refresh y logout', () => {
    it('TC-02: con una cookie válida, /auth/refresh devuelve un access token nuevo y rota la cookie', async () => {
      const first = refreshCookie(await register('refresh'));
      const res = await request(app.getHttpServer()).post('/v1/auth/refresh').set('Cookie', first).expect(200);
      expect(res.body.user.username).toBe(username('refresh'));
      expect(refreshCookie(res)).not.toBe(first);
    });

    it('detecta un refresh token reutilizado y cierra todas las sesiones del usuario', async () => {
      const first = refreshCookie(await register('robo'));
      const second = refreshCookie(await request(app.getHttpServer()).post('/v1/auth/refresh').set('Cookie', first).expect(200));

      await request(app.getHttpServer()).post('/v1/auth/refresh').set('Cookie', first).expect(401); // token viejo reutilizado
      await request(app.getHttpServer()).post('/v1/auth/refresh').set('Cookie', second).expect(401); // también se revocó
    });

    it('responde 401 sin cookie', () => {
      return request(app.getHttpServer()).post('/v1/auth/refresh').expect(401);
    });

    it('logout exige access token', () => {
      return request(app.getHttpServer()).post('/v1/auth/logout').expect(401);
    });

    it('TC-45: después del logout, el refresh token anterior ya no sirve', async () => {
      const res = await register('logout');
      const cookie = refreshCookie(res);
      await request(app.getHttpServer()).post('/v1/auth/logout').set('Authorization', `Bearer ${res.body.accessToken}`).set('Cookie', cookie).expect(204);
      await request(app.getHttpServer()).post('/v1/auth/refresh').set('Cookie', cookie).expect(401);
    });
  });

  describe('TC-39: recuperación de contraseña', () => {
    const tokenFromMail = (to: string) => new URL(sentMails.filter((m) => m.to === to).at(-1)!.url).searchParams.get('token')!;

    it('responde 204 exista o no el email, y solo envía correo si existe (TC-61: en el idioma pedido)', async () => {
      await register('olvido');
      await request(app.getHttpServer()).post('/v1/auth/forgot-password').set('X-Forwarded-For', newIp()).send({ email: email('noexiste') }).expect(204);
      await request(app.getHttpServer()).post('/v1/auth/forgot-password').set('X-Forwarded-For', newIp()).set('Accept-Language', 'es-CO').send({ email: email('olvido') }).expect(204);
      expect(sentMails.map((m) => m.to)).toEqual([email('olvido')]);
      expect(sentMails[0].locale).toBe('es'); // el correo va en el idioma en que se pidió
    });

    it('cambia la contraseña con el enlace del correo; el enlace es de un solo uso', async () => {
      const token = tokenFromMail(email('olvido'));
      const reset = () => request(app.getHttpServer()).post('/v1/auth/reset-password').set('X-Forwarded-For', newIp()).send({ token, newPassword: 'nuevaClave123' });

      await reset().expect(204);
      await login(email('olvido'), 'nuevaClave123', UserRole.PLAYER).expect(200);
      await login(email('olvido'), PASSWORD, UserRole.PLAYER).expect(401);
      await reset().expect(400);
    });

    it('rechaza un token inventado', () => {
      return request(app.getHttpServer()).post('/v1/auth/reset-password').set('X-Forwarded-For', newIp()).send({ token: 'inventado', newPassword: 'nuevaClave123' }).expect(400);
    });
  });

  describe('Google', () => {
    it('RF-022: crea la cuenta con el primer login de Google y la reutiliza en el siguiente', async () => {
      googleProfiles.set('token-nuevo', { googleId: `g-${RUN}`, email: email('google'), emailVerified: true, name: 'Juan Pérez' });
      const post = (body: object) => request(app.getHttpServer()).post('/v1/auth/login/google').set('X-Forwarded-For', newIp()).send(body);

      await post({ idToken: 'token-nuevo' }).expect(400); // sin consentimiento no se crea
      const first = await post({ idToken: 'token-nuevo', consentAccepted: true }).expect(200);
      const second = await post({ idToken: 'token-nuevo' }).expect(200);
      expect(second.body.user.id).toBe(first.body.user.id);
      expect(first.body.user.username).toMatch(/^Juan_?Perez/);
    });

    it('rechaza un id_token inválido', () => {
      return request(app.getHttpServer()).post('/v1/auth/login/google').set('X-Forwarded-For', newIp()).send({ idToken: 'falso' }).expect(401);
    });
  });
});
