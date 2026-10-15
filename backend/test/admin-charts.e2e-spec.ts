import { NestExpressApplication } from '@nestjs/platform-express';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/users/entities/user.entity';
import { AppClock } from '../src/shared/time/app-clock';
import { createTestApp, deleteE2eUsers, E2E_DOMAIN, E2E_PASSWORD, playGame, registerPlayer, RUN_ID } from './utils';

/**
 * Pruebas e2e de las gráficas del panel administrativo (Contrato de API §9.1–§9.6, RF-154 a
 * RF-175). Las métricas son globales y la base de desarrollo puede tener otros datos, así que
 * se comparan antes y después de que los jugadores de esta ejecución jueguen.
 */
/** Comparadores para valores que pueden ser null mientras no haya datos suficientes. */
const numberOrNull = { asymmetricMatch: (value: unknown) => value === null || typeof value === 'number' };
const stringOrNull = { asymmetricMatch: (value: unknown) => value === null || typeof value === 'string' };

describe('Admin: gráficas (e2e)', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  let admin: { id: string; auth: string };
  let player: Awaited<ReturnType<typeof registerPlayer>>;
  let catalog: Array<{ id: string; name: string }>;
  const api = () => request(app.getHttpServer());
  const get = (path: string, auth = admin.auth) => api().get(`/v1/admin${path}`).set('Authorization', auth);
  const body = async (path: string) => (await get(path).expect(200)).body;

  beforeAll(async () => {
    ({ app, db } = await createTestApp());
    const email = `admin.graficas.${RUN_ID}${E2E_DOMAIN}`;
    await db.getRepository(User).insert({ email, username: `admg_${RUN_ID}`, passwordHash: hashSync(E2E_PASSWORD, 10), role: UserRole.ADMIN, consentAcceptedAt: new Date() });
    const login = await api().post('/v1/auth/login').set('X-Forwarded-For', '10.7.0.1').send({ email, password: E2E_PASSWORD, role: 'admin' }).expect(200);
    admin = { id: login.body.user.id, auth: `Bearer ${login.body.accessToken}` };
    player = await registerPlayer(app, 'graficas');
    catalog = (await api().get('/v1/games').set('Authorization', player.auth)).body;
  });

  afterAll(async () => {
    await deleteE2eUsers(db);
    await app.close();
  });

  it('TC-66: un jugador recibe 403 en las gráficas nuevas y el período solo acepta 7, 30 o 90 días', async () => {
    for (const path of ['/games/overview', '/games/hardest-questions', '/economy/flow', '/economy/items', '/analytics/funnel', '/dashboard/trends', `/users/${player.id}/activity`]) {
      await get(path, player.auth).expect(403);
    }
    await get('/games/overview?days=15').expect(400);
    await get('/analytics/signups?days=abc').expect(400);
    await get('/economy/reasons?days=90').expect(200);
  });

  describe('Minijuegos', () => {
    it('TC-62: una partida completada y una abandonada se ven por minijuego, en los puntajes, el idioma y el reto diario', async () => {
      const daily = (await api().get('/v1/games/daily-challenge').set('Authorization', player.auth).expect(200)).body;
      const game = catalog.find((g) => g.id === daily.game.id)!;
      const before = await body('/games/overview?days=7');
      const scoresBefore = await body(`/games/${game.id}/scores?days=7`);
      const challengeBefore = await body('/games/daily-challenge?days=7');

      const result = await playGame(app, db, player.auth, game.id, [1, 2], true); // reto diario, 2 respuestas equivocadas
      const abandoned = (await api().post(`/v1/games/${game.id}/sessions`).set('Authorization', player.auth).send({}).expect(201)).body;
      await api().patch(`/v1/games/sessions/${abandoned.sessionId}`).set('Authorization', player.auth).send({ status: 'abandoned' }).expect(200);

      const after = await body('/games/overview?days=7');
      const row = (overview: { games: Array<{ gameId: string }> }) => overview.games.find((g) => g.gameId === game.id) as unknown as { completed: number; abandoned: number; accuracy: number; abandonRate: number };
      expect(after.games).toHaveLength(10);
      expect(after.games[0]).toEqual({ gameId: expect.any(String), name: expect.any(String), icon: expect.any(String), completed: expect.any(Number), abandoned: expect.any(Number), accuracy: numberOrNull, abandonRate: numberOrNull });
      expect(row(after).completed).toBe(row(before).completed + 1);
      expect(row(after).abandoned).toBe(row(before).abandoned + 1);
      expect(row(after).abandonRate).toBeGreaterThan(0);
      expect(after.locales.find((l: { locale: string }) => l.locale === 'en').sessions).toBe((before.locales.find((l: { locale: string }) => l.locale === 'en')?.sessions ?? 0) + 2);

      const scoresAfter = await body(`/games/${game.id}/scores?days=7`);
      expect(scoresAfter.length).toBeGreaterThanOrEqual(11);
      expect(scoresAfter[result.score].sessions).toBe(scoresBefore[result.score].sessions + 1);

      const challengeAfter = await body('/games/daily-challenge?days=7');
      expect(challengeAfter).toHaveLength(7);
      expect(challengeAfter.at(-1).players).toBe(challengeBefore.at(-1).players + 1);
    });

    it('TC-62: las preguntas más difíciles traen su tasa de aciertos y una respuesta legible', async () => {
      const hardest = await body('/games/hardest-questions?days=90');
      expect(hardest.length).toBeLessThanOrEqual(10);
      for (const q of hardest) {
        expect(q).toEqual({ questionId: expect.any(String), gameId: expect.any(String), gameName: expect.any(String), statement: expect.any(String), answer: stringOrNull, answers: expect.any(Number), correctRate: expect.any(Number) });
        expect(q.answers).toBeGreaterThanOrEqual(3);
        expect(q.correctRate).toBeGreaterThanOrEqual(0);
        expect(q.correctRate).toBeLessThanOrEqual(100);
      }
      const rates = hardest.map((q: { correctRate: number }) => q.correctRate);
      expect(rates).toEqual([...rates].sort((a, b) => a - b));
    });
  });

  describe('Economía', () => {
    it('TC-63: el reto diario suma créditos al flujo, a su motivo y a los créditos en circulación', async () => {
      const [flowBefore, reasonsBefore, circulationBefore] = await Promise.all([body('/economy/flow?days=7'), body('/economy/reasons?days=7'), body('/economy/circulation?days=7')]);
      const fresh = await registerPlayer(app, 'economia');
      const daily = (await api().get('/v1/games/daily-challenge').set('Authorization', fresh.auth).expect(200)).body;
      await playGame(app, db, fresh.auth, daily.game.id, [], true);

      const flow = await body('/economy/flow?days=7');
      expect(flow.granularity).toBe('day');
      expect(flow.points).toHaveLength(7);
      expect(flow.points.at(-1).earned).toBeGreaterThanOrEqual(flowBefore.points.at(-1).earned + 50);

      const reasons = await body('/economy/reasons?days=7');
      expect(reasons.map((r: { reason: string }) => r.reason)).toEqual(['daily_challenge', 'streak_7_days', 'share_result', 'referral']);
      expect(reasons[0].credits).toBe(reasonsBefore[0].credits + 50);

      const circulation = await body('/economy/circulation?days=7');
      expect(circulation.at(-1).credits).toBeGreaterThanOrEqual(circulationBefore.at(-1).credits + 50);

      const weekly = await body('/economy/flow?days=90');
      expect(weekly.granularity).toBe('week');
      expect(weekly.points.length).toBeGreaterThanOrEqual(13);
    });

    it('TC-63: artículos e insignias salen con su nombre en el idioma pedido', async () => {
      const items = (await get('/economy/items').set('Accept-Language', 'es').expect(200)).body;
      expect(items).toHaveLength(6);
      expect(items.map((i: { name: string }) => i.name)).toContain('Avatar Balón de Oro');
      expect(items[0]).toEqual({ itemId: expect.any(String), name: expect.any(String), icon: expect.any(String), type: expect.any(String), cost: expect.any(Number), purchases: expect.any(Number) });

      const badges = await body('/economy/badges');
      expect(badges).toHaveLength(7);
      const firstGame = badges.find((b: { code: string }) => b.code === 'first-game');
      expect(firstGame.name).toBe('First match');
      expect(firstGame.players).toBeGreaterThanOrEqual(2); // los jugadores de esta ejecución ya jugaron
    });
  });

  describe('Analítica', () => {
    it('TC-64: registros por día, embudo de activación, países, métodos de registro, niveles y mapa de calor', async () => {
      const signups = await body('/analytics/signups?days=7');
      expect(signups).toHaveLength(7);
      expect(signups.at(-1)).toEqual({ date: app.get(AppClock).today(), users: expect.any(Number) });
      expect(signups.at(-1).users).toBeGreaterThanOrEqual(2);

      const funnel = await body('/analytics/funnel?days=7');
      expect(funnel.map((s: { step: string }) => s.step)).toEqual(['registered', 'firstGame', 'regular', 'returned']);
      expect(funnel[0].players).toBeGreaterThanOrEqual(funnel[1].players);
      expect(funnel[1].players).toBeGreaterThanOrEqual(funnel[2].players);
      expect(funnel[1].players).toBeGreaterThanOrEqual(2);

      const countries = await body('/analytics/countries');
      expect(countries.length).toBeLessThanOrEqual(10);
      for (const c of countries) expect(c).toEqual({ country: expect.any(String), players: expect.any(Number) });

      const methods = await body('/analytics/signup-methods');
      expect(methods.map((m: { method: string }) => m.method)).toEqual(['email', 'google', 'both']);
      expect(methods[0].players).toBeGreaterThanOrEqual(2);

      const levels = await body('/analytics/levels');
      expect(levels.map((l: { range: string }) => l.range)).toEqual(['1', '2', '3', '4', '5', '6-10', '11-20', '21+']);

      const heatmap = await body('/analytics/heatmap?days=30');
      for (const cell of heatmap) {
        expect(cell.weekday).toBeGreaterThanOrEqual(0);
        expect(cell.weekday).toBeLessThanOrEqual(6);
        expect(cell.hour).toBeGreaterThanOrEqual(0);
        expect(cell.hour).toBeLessThanOrEqual(23);
      }
    });

    it('RF-166: las gráficas por categoría y la duración de sesión aceptan el período', async () => {
      expect(await body('/analytics/categories?days=7')).toHaveLength(8);
      expect(await body('/analytics/accuracy-radar?days=90')).toHaveLength(8);
      expect((await body('/analytics/session-duration?days=7')).buckets).toHaveLength(5);
    });
  });

  describe('Panel y detalle de jugador', () => {
    it('TC-65: el panel trae la tendencia de 7 días de cada KPI', async () => {
      const trends = await body('/dashboard/trends');
      expect(trends).toHaveLength(7);
      expect(trends.at(-1)).toEqual({ date: app.get(AppClock).today(), totalUsers: expect.any(Number), activeUsers: expect.any(Number), games: expect.any(Number), accuracy: numberOrNull });
      expect(trends.at(-1).totalUsers).toBeGreaterThanOrEqual(trends[0].totalUsers);
      expect(trends.at(-1).games).toBeGreaterThanOrEqual(2);
    });

    it('TC-65: "Ver perfil" trae la XP de 30 días y la precisión por categoría del jugador', async () => {
      const activity = await body(`/users/${player.id}/activity`);
      expect(activity.dailyXp).toHaveLength(30);
      expect(activity.dailyXp.at(-1).xp).toBeGreaterThan(0);
      expect(activity.accuracyByCategory).toHaveLength(8);
      expect(activity.accuracyByCategory.some((c: { accuracy: number | null }) => c.accuracy !== null)).toBe(true);
      await get('/users/00000000-0000-0000-0000-000000000000/activity').expect(404);
    });
  });
});
