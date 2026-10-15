import { EventEmitter2 } from '@nestjs/event-emitter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { DomainEvents, StreakReachedEvent } from '../src/shared/events/domain-events';
import { dateInTimeZone } from '../src/shared/time/app-date';
import { UserSession } from '../src/users/entities/user-session.entity';
import { User, UserRole } from '../src/users/entities/user.entity';
import { createTestApp, deleteE2eUsers, E2E_DOMAIN, E2E_PASSWORD, playGame, registerPlayer, RUN_ID } from './utils';

/** Pruebas e2e del módulo Users contra PostgreSQL real (requiere db:up, migration:run y seed). */
describe('Users (e2e)', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  let firstGameId: string;
  const streakEvents: StreakReachedEvent[] = [];
  const api = () => request(app.getHttpServer());
  const me = (auth: string) => api().get('/v1/users/me').set('Authorization', auth);
  const daysAgo = (days: number) => dateInTimeZone('America/Bogota', new Date(Date.now() - days * 86_400_000));

  beforeAll(async () => {
    ({ app, db } = await createTestApp());
    app.get(EventEmitter2).on(DomainEvents.STREAK_REACHED, (e: StreakReachedEvent) => streakEvents.push(e));
    const player = await registerPlayer(app, 'catalogo');
    firstGameId = (await api().get('/v1/games').set('Authorization', player.auth)).body[0].id;
  });

  afterAll(async () => {
    await deleteE2eUsers(db);
    await app.close();
  });

  describe('perfil', () => {
    it('RF-055/RF-104: un jugador nuevo empieza en nivel 1, sin XP, racha ni insignias', async () => {
      const player = await registerPlayer(app, 'nuevo');
      const res = await me(player.auth).expect(200);
      expect(res.body).toMatchObject({ id: player.id, username: player.username, email: player.email, role: 'player', level: 1, xpTotal: 0, xpToNextLevel: 100, streakDays: 0, badgesCount: 0, hasPassword: true });
    });

    it('TC-33: ninguna respuesta de Users incluye password_hash', async () => {
      const player = await registerPlayer(app, 'sinhash');
      for (const path of ['/v1/users/me', '/v1/users/me/stats', '/v1/users/me/badges']) {
        const res = await api().get(path).set('Authorization', player.auth).expect(200);
        expect(JSON.stringify(res.body)).not.toMatch(/password_?hash/i);
      }
    });

    it('exige sesión', () => api().get('/v1/users/me').expect(401));
  });

  describe('progreso al completar partidas', () => {
    it('TC-11/TC-20: la XP, el nivel, la racha, la precisión y las partidas jugadas se actualizan', async () => {
      const player = await registerPlayer(app, 'progreso');
      const game = await playGame(app, db, player.auth, firstGameId, [1]);

      const profile = (await me(player.auth).expect(200)).body;
      expect(profile).toMatchObject({ xpTotal: game.xpEarned, level: Math.floor(game.xpEarned / 100) + 1, streakDays: 1 });

      const stats = (await api().get('/v1/users/me/stats').set('Authorization', player.auth).expect(200)).body;
      expect(stats).toEqual({ accuracy: game.accuracy, xpTotal: game.xpEarned, gamesPlayed: 1, badgesCount: 1 });
    });

    it('la precisión es histórica: aciertos totales / preguntas totales', async () => {
      const player = await registerPlayer(app, 'precision');
      const a = await playGame(app, db, player.auth, firstGameId); // todo bien
      const b = await playGame(app, db, player.auth, firstGameId, [1, 2]); // dos mal
      const expected = Math.round(((a.score + b.score) / (a.totalQuestions + b.totalQuestions)) * 10_000) / 100;
      expect((await api().get('/v1/users/me/stats').set('Authorization', player.auth)).body).toMatchObject({ accuracy: expected, gamesPlayed: 2, xpTotal: a.xpEarned + b.xpEarned });
    });

    it('otorga "Primer partido" y "Perfeccionista" (todas bien), y lista todas las insignias', async () => {
      const player = await registerPlayer(app, 'insignias');
      await playGame(app, db, player.auth, firstGameId);
      const badges = (await api().get('/v1/users/me/badges').set('Authorization', player.auth).expect(200)).body;

      expect(badges).toHaveLength(7);
      const earned = badges.filter((b: { earnedAt: string | null }) => b.earnedAt).map((b: { code: string }) => b.code);
      expect(earned.sort()).toEqual(['first-game', 'perfect-game']);
      expect(badges[0]).toEqual({ code: expect.any(String), name: expect.any(String), icon: expect.any(String), description: expect.any(String), earnedAt: expect.any(String) });
      // Las insignias salen en el idioma pedido (inglés por defecto).
      expect(badges.find((b: { code: string }) => b.code === 'first-game').name).toBe('First match');
      const es = (await api().get('/v1/users/me/badges').set('Authorization', player.auth).set('Accept-Language', 'es').expect(200)).body;
      expect(es.find((b: { code: string }) => b.code === 'first-game').name).toBe('Primer partido');
    });

    it('la racha sube si jugó ayer; al llegar a 7 días da la insignia y emite StreakReachedEvent', async () => {
      const player = await registerPlayer(app, 'racha');
      await db.getRepository(User).update({ id: player.id }, { streakDays: 6, lastPlayedOn: daysAgo(1) });
      await playGame(app, db, player.auth, firstGameId);

      expect((await me(player.auth)).body.streakDays).toBe(7);
      expect(streakEvents).toContainEqual(new StreakReachedEvent(player.id, 7));
      const badges = (await api().get('/v1/users/me/badges').set('Authorization', player.auth)).body;
      expect(badges.find((b: { code: string }) => b.code === 'streak-7').earnedAt).not.toBeNull();

      // Otra partida el mismo día no sube la racha ni vuelve a premiar.
      await playGame(app, db, player.auth, firstGameId);
      expect((await me(player.auth)).body.streakDays).toBe(7);
      expect(streakEvents.filter((e) => e.userId === player.id)).toHaveLength(1);
    });

    it('la racha se muestra en 0 si dejó pasar un día, y vuelve a 1 al jugar', async () => {
      const player = await registerPlayer(app, 'rota');
      await db.getRepository(User).update({ id: player.id }, { streakDays: 5, lastPlayedOn: daysAgo(3) });
      expect((await me(player.auth)).body.streakDays).toBe(0);
      await playGame(app, db, player.auth, firstGameId);
      expect((await me(player.auth)).body.streakDays).toBe(1);
    });
  });

  describe('editar perfil', () => {
    it('RF-112: cambia el nombre de usuario y el país', async () => {
      const player = await registerPlayer(app, 'editar');
      const res = await api().patch('/v1/users/me').set('Authorization', player.auth).send({ username: `editado_${RUN_ID}`, country: 'co' }).expect(200);
      expect(res.body).toMatchObject({ username: `editado_${RUN_ID}`, country: 'CO' });
    });

    it('responde 409 si el nombre ya lo usa otra persona (sin importar mayúsculas)', async () => {
      const a = await registerPlayer(app, 'dueno');
      const b = await registerPlayer(app, 'copion');
      await api().patch('/v1/users/me').set('Authorization', b.auth).send({ username: a.username.toUpperCase() }).expect(409);
    });

    it('rechaza país inválido, scripts en el nombre y campos no permitidos (ej. rol)', async () => {
      const player = await registerPlayer(app, 'invalido');
      await api().patch('/v1/users/me').set('Authorization', player.auth).send({ country: 'Colombia' }).expect(400);
      await api().patch('/v1/users/me').set('Authorization', player.auth).send({ username: '<b>hola</b>' }).expect(400);
      await api().patch('/v1/users/me').set('Authorization', player.auth).send({ role: 'admin' }).expect(400);
      await api().patch('/v1/users/me').set('Authorization', player.auth).send({ xpTotal: 99999 }).expect(400);
    });
  });

  describe('cambiar contraseña', () => {
    it('exige la contraseña actual correcta', async () => {
      const player = await registerPlayer(app, 'clavemal');
      await api().patch('/v1/users/me/password').set('Authorization', player.auth).send({ currentPassword: 'incorrecta', newPassword: 'otraClave123' }).expect(400);
    });

    it('cambia la contraseña y cierra todas las sesiones', async () => {
      const player = await registerPlayer(app, 'clave');
      await api().patch('/v1/users/me/password').set('Authorization', player.auth).send({ currentPassword: E2E_PASSWORD, newPassword: 'otraClave123' }).expect(204);

      await api().post('/v1/auth/refresh').set('Cookie', player.cookie).expect(401);
      const login = (password: string) => api().post('/v1/auth/login').set('X-Forwarded-For', `10.8.1.${Math.floor(Math.random() * 250)}`).send({ email: player.email, password, role: 'player' });
      await login(E2E_PASSWORD).expect(401);
      await login('otraClave123').expect(200);
    });
  });

  describe('TC-48: eliminar la cuenta', () => {
    it('exige confirmar con la contraseña', async () => {
      const player = await registerPlayer(app, 'borrarsin');
      await api().delete('/v1/users/me').set('Authorization', player.auth).send({}).expect(400);
      await api().delete('/v1/users/me').set('Authorization', player.auth).send({ password: 'incorrecta' }).expect(400);
    });

    it('borra la cuenta y sus datos; ya no puede iniciar sesión', async () => {
      const player = await registerPlayer(app, 'borrar');
      await playGame(app, db, player.auth, firstGameId);
      await api().delete('/v1/users/me').set('Authorization', player.auth).send({ password: E2E_PASSWORD }).expect(204);

      expect(await db.getRepository(User).findOneBy({ id: player.id })).toBeNull();
      expect(await db.query('SELECT 1 FROM game_sessions WHERE user_id = $1', [player.id])).toHaveLength(0);
      await me(player.auth).expect(401);
      await api().post('/v1/auth/login').set('X-Forwarded-For', '10.8.2.1').send({ email: player.email, password: E2E_PASSWORD, role: 'player' }).expect(401);
    });

    it('un administrador no puede borrarse a sí mismo', async () => {
      await db.getRepository(User).insert({ email: `admin.borrar.${RUN_ID}${E2E_DOMAIN}`, username: `adminb_${RUN_ID}`, passwordHash: hashSync(E2E_PASSWORD, 10), role: UserRole.ADMIN, consentAcceptedAt: new Date() });
      const login = await api().post('/v1/auth/login').set('X-Forwarded-For', '10.8.3.1').send({ email: `admin.borrar.${RUN_ID}${E2E_DOMAIN}`, password: E2E_PASSWORD, role: 'admin' }).expect(200);
      await api().delete('/v1/users/me').set('Authorization', `Bearer ${login.body.accessToken}`).send({ password: E2E_PASSWORD }).expect(403);
    });
  });

  describe('actividad de uso (heartbeat)', () => {
    it('varias señales seguidas extienden una sola sesión de uso', async () => {
      const player = await registerPlayer(app, 'activo');
      for (let i = 0; i < 3; i++) await api().post('/v1/activity/heartbeat').set('Authorization', player.auth).expect(204);
      expect(await db.getRepository(UserSession).countBy({ userId: player.id })).toBe(1);
    });

    it('después de 30 minutos sin señales, empieza una sesión nueva', async () => {
      const player = await registerPlayer(app, 'inactivo');
      await api().post('/v1/activity/heartbeat').set('Authorization', player.auth).expect(204);
      await db.getRepository(UserSession).update({ userId: player.id }, { lastSeenAt: new Date(Date.now() - 31 * 60_000) });
      await api().post('/v1/activity/heartbeat').set('Authorization', player.auth).expect(204);
      expect(await db.getRepository(UserSession).countBy({ userId: player.id })).toBe(2);
    });
  });
});
