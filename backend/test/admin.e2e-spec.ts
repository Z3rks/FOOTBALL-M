import { NestExpressApplication } from '@nestjs/platform-express';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AdminAuditLog } from '../src/admin/audit/entities/admin-audit-log.entity';
import { GameSession } from '../src/games/entities/game-session.entity';
import { addDays } from '../src/shared/time/app-date';
import { UserSession } from '../src/users/entities/user-session.entity';
import { User, UserRole } from '../src/users/entities/user.entity';
import { AppClock } from '../src/shared/time/app-clock';
import { UsersStatsReader } from '../src/users/users-stats.reader';
import { createTestApp, deleteE2eUsers, E2E_DOMAIN, E2E_PASSWORD, playGame, registerPlayer, RUN_ID } from './utils';

/**
 * Pruebas e2e del panel administrativo contra PostgreSQL real. Las métricas son globales y la
 * base de desarrollo puede tener otros datos, así que se comparan antes/después de cada acción
 * o se buscan los usuarios de esta ejecución (RUN_ID).
 */
/** Algunas métricas son null cuando todavía no hay datos suficientes. */
const isNumberOrNull = (value: unknown) => value === null || typeof value === 'number';

describe('Admin (e2e)', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  let admin: { id: string; auth: string };
  let player: Awaited<ReturnType<typeof registerPlayer>>;
  let catalog: Array<{ id: string; name: string }>;
  const api = () => request(app.getHttpServer());
  const get = (path: string, auth = admin.auth) => api().get(`/v1/admin${path}`).set('Authorization', auth);
  const audits = (action: string, targetUserId?: string) =>
    db.getRepository(AdminAuditLog).findBy({ adminUserId: admin.id, action, ...(targetUserId && { targetUserId }) });

  beforeAll(async () => {
    ({ app, db } = await createTestApp());
    const email = `admin.${RUN_ID}${E2E_DOMAIN}`;
    await db.getRepository(User).insert({ email, username: `adm_${RUN_ID}`, passwordHash: hashSync(E2E_PASSWORD, 10), role: UserRole.ADMIN, consentAcceptedAt: new Date() });
    const login = await api().post('/v1/auth/login').set('X-Forwarded-For', '10.6.0.1').send({ email, password: E2E_PASSWORD, role: 'admin' }).expect(200);
    admin = { id: login.body.user.id, auth: `Bearer ${login.body.accessToken}` };
    player = await registerPlayer(app, 'jugadoradm');
    catalog = (await api().get('/v1/games').set('Authorization', player.auth)).body;
  });

  afterAll(async () => {
    await deleteE2eUsers(db);
    await app.close();
  });

  it('TC-34: un jugador recibe 403 en todos los endpoints /admin/*', async () => {
    for (const path of ['/dashboard/summary', '/dashboard/dau', '/dashboard/ranking', '/users', '/users/export', '/analytics/kpis', '/reports/summary', '/reports/export']) {
      await get(path, player.auth).expect(403);
    }
    await api().patch(`/v1/admin/users/${player.id}/status`).set('Authorization', player.auth).send({ status: 'inactive' }).expect(403);
    await api().get('/v1/admin/users').expect(401);
  });

  it('TC-55: un administrador no juega ni usa créditos: las métricas solo tienen partidas de jugadores', async () => {
    await api().get('/v1/games').set('Authorization', admin.auth).expect(403);
    await api().post(`/v1/games/${catalog[0].id}/sessions`).set('Authorization', admin.auth).send({}).expect(403);
    await api().get('/v1/credits/balance').set('Authorization', admin.auth).expect(403);
    await api().get('/v1/store/items').set('Authorization', admin.auth).expect(403);
  });

  describe('dashboard', () => {
    it('TC-24: los KPIs de hoy reflejan una partida nueva y un usuario activo nuevo', async () => {
      const before = (await get('/dashboard/summary').expect(200)).body;
      const fresh = await registerPlayer(app, 'kpi');
      await api().post('/v1/activity/heartbeat').set('Authorization', fresh.auth).expect(204);
      await playGame(app, db, fresh.auth, catalog[0].id);
      const after = (await get('/dashboard/summary').expect(200)).body;

      expect(after).toMatchObject({ status: 'online', alerts: expect.any(Array) });
      expect(after.kpis.totalUsers.value).toBe(before.kpis.totalUsers.value + 1);
      expect(after.kpis.activeToday.value).toBe(before.kpis.activeToday.value + 1);
      expect(after.kpis.gamesToday.value).toBe(before.kpis.gamesToday.value + 1);
      expect(after.kpis.averageAccuracy).toHaveProperty('change');
    });

    it('los administradores no cuentan como usuarios', async () => {
      const before = (await get('/dashboard/summary')).body.kpis.totalUsers.value;
      await db.getRepository(User).insert({ email: `admin2.${RUN_ID}${E2E_DOMAIN}`, username: `adm2_${RUN_ID}`, role: UserRole.ADMIN, consentAcceptedAt: new Date() });
      expect((await get('/dashboard/summary')).body.kpis.totalUsers.value).toBe(before);
    });

    it('RF-125: usuarios activos de los últimos 7 días, terminando hoy', async () => {
      const res = (await get('/dashboard/dau').expect(200)).body;
      const today = app.get(AppClock).today();
      expect(res.days).toHaveLength(7);
      expect(res.days.at(-1)).toMatchObject({ date: today, users: expect.any(Number) });
      expect(res.days[0].date).toBe(addDays(today, -6));
      expect(res.days.at(-1).users).toBeGreaterThanOrEqual(1);
    });

    it('RF-126: ranking de los 4 minijuegos más jugados; una partida suma una jugada', async () => {
      const before = (await get('/dashboard/ranking').expect(200)).body;
      expect(before).toHaveLength(4);
      expect(before[0]).toEqual({ gameId: expect.any(String), name: expect.any(String), icon: expect.any(String), plays: expect.any(Number), avgScore: expect.any(Number), trend: expect.stringMatching(/^(up|down|flat)$/) });
      await playGame(app, db, player.auth, before[0].gameId);
      const after = (await get('/dashboard/ranking')).body;
      expect(after.find((g: { gameId: string }) => g.gameId === before[0].gameId).plays).toBe(before[0].plays + 1);
    });

    it('el ranking muestra los minijuegos en el idioma pedido', async () => {
      const en = (await get('/dashboard/ranking').expect(200)).body as Array<{ gameId: string; name: string }>;
      const es = (await get('/dashboard/ranking').set('Accept-Language', 'es').expect(200)).body as Array<{ gameId: string; name: string }>;
      expect(es.map((g) => g.gameId)).toEqual(en.map((g) => g.gameId));
      expect(es.map((g) => g.name)).not.toEqual(en.map((g) => g.name));
    });
  });

  describe('gestión de usuarios', () => {
    it('TC-26: busca por nombre parcial o email, con conteos por filtro y sin administradores', async () => {
      const res = (await get(`/users?search=${RUN_ID}&limit=100`).expect(200)).body;
      const usernames = res.data.map((u: { username: string }) => u.username);
      expect(usernames).toContain(player.username);
      expect(usernames.some((u: string) => u.startsWith('adm'))).toBe(false);
      expect(res.counts).toMatchObject({ all: res.total, active: expect.any(Number), inactive: expect.any(Number), new7d: res.total });
      expect(res.data[0]).toEqual({
        id: expect.any(String),
        username: expect.any(String),
        email: expect.any(String),
        country: null,
        status: expect.any(String),
        level: expect.any(Number),
        streakDays: expect.any(Number),
        xpTotal: expect.any(Number),
        createdAt: expect.any(String),
      });
      expect(JSON.stringify(res)).not.toMatch(/password_?hash/i);

      const byEmail = (await get(`/users?search=${encodeURIComponent(player.email)}`).expect(200)).body;
      expect(byEmail.data.map((u: { id: string }) => u.id)).toEqual([player.id]);
    });

    it('trata % y _ de la búsqueda como texto, no como comodines', async () => {
      const res = (await get('/users?search=%25%25%25').expect(200)).body;
      expect(res.total).toBe(0);
    });

    it('rechaza filtros y paginación inválidos', async () => {
      await get('/users?filter=todos').expect(400);
      await get('/users?limit=1000').expect(400);
    });

    it('RF-134/136: detalle de un jugador con sus estadísticas; 404 para admins o inexistentes', async () => {
      const res = (await get(`/users/${player.id}`).expect(200)).body;
      expect(res).toMatchObject({ id: player.id, status: 'active', gamesPlayed: expect.any(Number), badgesCount: expect.any(Number), creditsBalance: 0, lastActiveAt: null });
      await get(`/users/${admin.id}`).expect(404);
      await get('/users/00000000-0000-4000-8000-000000000000').expect(404);
    });

    it('TC-27/TC-46: suspender cambia el estado, cierra sus sesiones y queda auditado', async () => {
      const target = await registerPlayer(app, 'suspender');
      const res = await api().patch(`/v1/admin/users/${target.id}/status`).set('Authorization', admin.auth).set('X-Forwarded-For', '10.6.0.9').send({ status: 'inactive' }).expect(200);
      expect(res.body.status).toBe('inactive');

      await api().get('/v1/users/me').set('Authorization', target.auth).expect(403); // su access token ya no sirve
      await api().post('/v1/auth/refresh').set('Cookie', target.cookie).expect(401); // ni su sesión
      const [log] = await audits('Suspend user', target.id);
      expect(log).toMatchObject({ ipAddress: '10.6.0.9', details: `username=${target.username}` });

      const filtered = (await get(`/users?search=${target.username}&filter=inactive`)).body;
      expect(filtered.data.map((u: { id: string }) => u.id)).toEqual([target.id]);

      await api().patch(`/v1/admin/users/${target.id}/status`).set('Authorization', admin.auth).send({ status: 'active' }).expect(200);
      expect(await audits('Activate user', target.id)).toHaveLength(1);
    });

    it('no se puede cambiar el estado de un administrador ni enviar un estado inválido', async () => {
      await api().patch(`/v1/admin/users/${admin.id}/status`).set('Authorization', admin.auth).send({ status: 'inactive' }).expect(404);
      await api().patch(`/v1/admin/users/${player.id}/status`).set('Authorization', admin.auth).send({ status: 'banned' }).expect(400);
    });

    it('TC-46: eliminar un jugador lo borra y queda auditado aunque el usuario ya no exista', async () => {
      const target = await registerPlayer(app, 'eliminar');
      await api().delete(`/v1/admin/users/${target.id}`).set('Authorization', admin.auth).expect(204);
      expect(await db.getRepository(User).findOneBy({ id: target.id })).toBeNull();
      expect(await audits('Delete user', target.id)).toHaveLength(1);
      await api().delete(`/v1/admin/users/${target.id}`).set('Authorization', admin.auth).expect(404);
    });

    it('TC-41: exportar descarga un CSV con los filtros aplicados y queda auditado', async () => {
      const res = await get(`/users/export?search=${player.username}`).expect(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment; filename="football-maestro-users.csv"/);
      const lines = res.text.replace(/^﻿/, '').trim().split('\r\n');
      expect(lines[0]).toBe('username,email,country,status,level,streak_days,xp_total,accuracy,registered_at');
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain(player.email);
      expect(await audits('Export users')).toHaveLength(1);

      // En español: mismo contenido, con encabezados y nombre del archivo en español.
      const es = await get(`/users/export?search=${player.username}`).set('Accept-Language', 'es').expect(200);
      expect(es.headers['content-disposition']).toMatch(/filename="football-maestro-usuarios.csv"/);
      expect(es.text).toContain('usuario,correo,pais,estado,nivel,racha_dias,xp_total,precision,fecha_registro');
    });
  });

  describe('analytics', () => {
    it('RF-138 a RF-144: todas las gráficas responden con su forma esperada', async () => {
      const kpis = (await get('/analytics/kpis').expect(200)).body;
      expect(Object.keys(kpis).sort()).toEqual(['averageSessionMinutes', 'dauMau', 'retentionD7']);
      expect(typeof kpis.averageSessionMinutes).toBe('number');
      expect(isNumberOrNull(kpis.retentionD7) && isNumberOrNull(kpis.dauMau)).toBe(true);

      const growth = (await get('/analytics/growth').expect(200)).body;
      expect(growth).toHaveLength(6);
      expect(growth.at(-1).month).toBe(app.get(AppClock).today().slice(0, 7));

      const retention = (await get('/analytics/retention').expect(200)).body;
      expect(retention.map((r: { day: number }) => r.day)).toEqual([1, 3, 7, 14, 30]);

      const categories = (await get('/analytics/categories').expect(200)).body;
      expect(categories).toHaveLength(8);

      const duration = (await get('/analytics/session-duration').expect(200)).body;
      expect(duration.buckets.map((b: { range: string }) => b.range)).toEqual(['<2m', '2-5m', '5-10m', '10-20m', '>20m']);

      const radar = (await get('/analytics/accuracy-radar').expect(200)).body;
      expect(radar.map((r: { category: string }) => r.category).sort()).toEqual(categories.map((c: { category: string }) => c.category).sort());
    });

    it('TC-28: la retención día 7 se calcula sobre los datos (1 de 2 jugadores volvió → 50%)', async () => {
      const stats = app.get(UsersStatsReader);
      const signup = addDays(app.get(AppClock).today(), -400); // fecha que no usa ningún otro dato
      const [returned, gone] = [await registerPlayer(app, 'volvio'), await registerPlayer(app, 'noVolvio')];
      const signupAt = new Date(`${signup}T15:00:00Z`);
      await db.getRepository(User).update({ id: returned.id }, { createdAt: signupAt });
      await db.getRepository(User).update({ id: gone.id }, { createdAt: signupAt });
      const back = new Date(`${addDays(signup, 8)}T15:00:00Z`);
      await db.getRepository(UserSession).insert({ userId: returned.id, startedAt: back, lastSeenAt: back });

      expect(await stats.retention(7, signup, signup)).toBe(50);
      expect(await stats.retention(30, signup, signup)).toBe(0);
    });
  });

  describe('reportes', () => {
    it('RF-146 a RF-148: resumen del mes con métricas clave y 4 semanas', async () => {
      const res = (await get('/reports/summary').expect(200)).body;
      expect(res.month).toBe(app.get(AppClock).today().slice(0, 7));
      expect(res.keyMetrics).toEqual({ totalGames: expect.any(Number), averageSessionMinutes: expect.any(Number), questionsAnswered: expect.any(Number), averageDailyXpPerActiveUser: expect.any(Number) });
      expect(res.weeks).toHaveLength(4);
      expect(res.weeks.at(-1)).toMatchObject({ label: expect.stringMatching(/^Wk \d+$/), week: expect.any(Number), current: true });
      expect(res.keyMetrics.totalGames).toBeGreaterThanOrEqual(1);
    });

    it('RF-149: permite meses anteriores y rechaza futuros o con formato inválido', async () => {
      const current = app.get(AppClock).today().slice(0, 7);
      const [year, month] = current.split('-').map(Number);
      const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
      await get('/reports/summary?month=2026-01').expect(200);
      await get(`/reports/summary?month=${next}`).expect(400);
      await get('/reports/summary?month=2026-13').expect(400);
      await get('/reports/summary?month=septiembre').expect(400);
    });

    it('TC-29: el top 5 ordena por XP del mes, con país y precisión', async () => {
      const champion = await registerPlayer(app, 'campeon');
      await db.getRepository(User).update({ id: champion.id }, { country: 'CO' });
      const game = await playGame(app, db, champion.auth, catalog[0].id);
      await db.getRepository(GameSession).update({ id: game.id }, { xpEarned: 9_999_999 });

      const top = (await get('/reports/top-players').expect(200)).body;
      expect(top.length).toBeLessThanOrEqual(5);
      expect(top[0]).toEqual({ rank: 1, userId: champion.id, username: champion.username, country: 'CO', xp: 9_999_999, accuracy: game.accuracy });
    });

    it('RF-151 y RF-152: rendimiento por categoría y actividad por hora', async () => {
      const categories = (await get('/reports/category-performance').expect(200)).body;
      expect(categories).toHaveLength(8);
      expect(categories[0]).toEqual({ category: expect.any(String), games: expect.any(Number), accuracy: categories[0].accuracy, trend: expect.stringMatching(/^(up|down|flat)$/) });
      expect(categories.every((c: { accuracy: unknown }) => isNumberOrNull(c.accuracy))).toBe(true);

      const peak = (await get('/reports/peak-hours').expect(200)).body;
      expect(peak.hours).toHaveLength(24);
      expect(peak.hours[23]).toEqual({ hour: 23, sessions: expect.any(Number) });
    });

    it('TC-30: exportar el reporte completo descarga un CSV con todas las secciones y queda auditado', async () => {
      const month = app.get(AppClock).today().slice(0, 7);
      const res = await get('/reports/export').expect(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toContain(`football-maestro-report-${month}.csv`);
      for (const section of ['Key metrics', 'week,from,to', 'rank,user', 'category,games', 'hour,sessions']) expect(res.text).toContain(section);

      const es = await get('/reports/export').set('Accept-Language', 'es').expect(200);
      expect(es.headers['content-disposition']).toContain(`football-maestro-reporte-${month}.csv`);
      for (const section of ['Métricas clave', 'semana,desde,hasta', 'puesto,usuario', 'categoria,partidas', 'hora,sesiones', 'Jugadores']) expect(es.text).toContain(section);
      expect(await db.getRepository(AdminAuditLog).findBy({ adminUserId: admin.id, action: 'Export report', details: `month=${month}` })).toHaveLength(2);
    });
  });
});
