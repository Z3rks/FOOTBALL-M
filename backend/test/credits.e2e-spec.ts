import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { CreditsService } from '../src/credits/credits.service';
import { CreditReason, CreditTransaction } from '../src/credits/entities/credit-transaction.entity';
import { dateInTimeZone } from '../src/shared/time/app-date';
import { User } from '../src/users/entities/user.entity';
import { createTestApp, deleteE2eUsers, playGame, registerPlayer } from './utils';

type StoreItemView = { id: string; name: string; type: string; cost: number; owned: boolean; equipped: boolean; affordable: boolean };

/** Pruebas e2e del módulo Credits contra PostgreSQL real (requiere db:up, migration:run y seed). */
describe('Credits (e2e)', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  let firstGameId: string;
  const api = () => request(app.getHttpServer());
  const balance = async (auth: string) => (await api().get('/v1/credits/balance').set('Authorization', auth).expect(200)).body.balance as number;
  const items = async (auth: string) => (await api().get('/v1/store/items').set('Authorization', auth).expect(200)).body as StoreItemView[];
  // IP distinta por compra: todas las pruebas salen de la misma máquina y chocarían con el límite de 10 compras/min.
  let ip = 0;
  const purchase = (auth: string, itemId: string) =>
    api().post(`/v1/store/items/${itemId}/purchase`).set('Authorization', auth).set('X-Forwarded-For', `10.7.0.${++ip}`);
  const setBalance = (userId: string, credits: number) => db.getRepository(User).update({ id: userId }, { creditsBalance: credits });
  const ledger = (userId: string) => db.getRepository(CreditTransaction).find({ where: { userId }, order: { createdAt: 'ASC' } });

  beforeAll(async () => {
    ({ app, db } = await createTestApp());
    const player = await registerPlayer(app, 'catalogocr');
    firstGameId = (await api().get('/v1/games').set('Authorization', player.auth)).body[0].id;
  });

  afterAll(async () => {
    await deleteE2eUsers(db);
    await app.close();
  });

  describe('saldo y formas de ganar', () => {
    it('RF-115: lista las 4 formas de ganar créditos con sus montos', async () => {
      const player = await registerPlayer(app, 'metodos');
      const res = await api().get('/v1/credits/earn-methods').set('Authorization', player.auth).expect(200);
      expect(res.body).toEqual([
        { reason: 'daily_challenge', method: 'Complete Daily Challenge', credits: 50 },
        { reason: 'streak_7_days', method: 'Maintain 7-day streak', credits: 100 },
        { reason: 'share_result', method: 'Share your results', credits: 25 },
        { reason: 'referral', method: 'Refer a friend', credits: 200 },
      ]);
    });

    it('RF-114: un jugador nuevo empieza con 0 créditos', async () => {
      const player = await registerPlayer(app, 'saldo0');
      expect(await balance(player.auth)).toBe(0);
    });
  });

  describe('recompensas', () => {
    it('+50 al completar el reto diario (y solo el reto)', async () => {
      const player = await registerPlayer(app, 'retocr');
      const daily = (await api().get('/v1/games/daily-challenge').set('Authorization', player.auth)).body;
      const other = (await api().get('/v1/games').set('Authorization', player.auth)).body.find((g: { id: string }) => g.id !== daily.game.id);

      await playGame(app, db, player.auth, other.id);
      expect(await balance(player.auth)).toBe(0);
      const session = await playGame(app, db, player.auth, daily.game.id, [], true);
      expect(await balance(player.auth)).toBe(50);
      expect(await ledger(player.id)).toMatchObject([{ amount: 50, type: 'earn', reason: 'daily_challenge', referenceId: session.id }]);
    });

    it('+25 al compartir un resultado, una sola vez por partida', async () => {
      const player = await registerPlayer(app, 'compartecr');
      const session = await playGame(app, db, player.auth, firstGameId);
      for (let i = 0; i < 2; i++) await api().post(`/v1/games/sessions/${session.id}/share`).set('Authorization', player.auth).expect(200);
      expect(await balance(player.auth)).toBe(25);
    });

    it('+200 a quien invita a un amigo que se registra con su código', async () => {
      const host = await registerPlayer(app, 'anfitrion');
      const guest = await registerPlayer(app, 'invitado', { referralCode: host.username });
      expect(await balance(host.auth)).toBe(200);
      expect(await balance(guest.auth)).toBe(0);
      expect(await ledger(host.id)).toMatchObject([{ amount: 200, reason: 'referral', referenceId: guest.id }]);
    });

    it('+100 al llegar a 7 días de racha', async () => {
      const player = await registerPlayer(app, 'rachacr');
      const yesterday = dateInTimeZone('America/Bogota', new Date(Date.now() - 86_400_000));
      await db.getRepository(User).update({ id: player.id }, { streakDays: 6, lastPlayedOn: yesterday });
      await playGame(app, db, player.auth, firstGameId);
      expect(await balance(player.auth)).toBe(100);
    });

    it('la misma recompensa con la misma referencia no se paga dos veces', async () => {
      const player = await registerPlayer(app, 'idempotente');
      const credits = app.get(CreditsService);
      const sessionId = '00000000-0000-4000-8000-000000000001';
      expect(await credits.earn(player.id, CreditReason.SHARE_RESULT, sessionId)).toBe(true);
      expect(await credits.earn(player.id, CreditReason.SHARE_RESULT, sessionId)).toBe(false);
      expect(await balance(player.auth)).toBe(25);
    });
  });

  describe('tienda', () => {
    it('RF-117: muestra los 6 artículos; sin saldo, ninguno se puede comprar', async () => {
      const player = await registerPlayer(app, 'vitrina');
      const list = await items(player.auth);
      expect(list).toHaveLength(6);
      expect(list.map((i) => i.cost)).toEqual([...list.map((i) => i.cost)].sort((a, b) => a - b));
      expect(list.every((i) => !i.affordable && !i.owned && !i.equipped)).toBe(true);
    });

    it('TC-23: sin saldo suficiente la compra no se procesa (400)', async () => {
      const player = await registerPlayer(app, 'pobre');
      const [cheapest] = await items(player.auth);
      const res = await purchase(player.auth, cheapest.id).expect(400);
      expect(res.body.message).toBe('Not enough credits');
      expect(await balance(player.auth)).toBe(0);
      expect(await ledger(player.id)).toHaveLength(0);
    });

    it('TC-22: compra, descuenta, registra el movimiento, aplica el artículo y da "Coleccionista"', async () => {
      const player = await registerPlayer(app, 'comprador');
      await setBalance(player.id, 500);
      const [cheapest] = await items(player.auth);

      const res = await purchase(player.auth, cheapest.id).expect(201);
      expect(res.body).toEqual({ purchased: true, item: { id: cheapest.id, name: cheapest.name, type: cheapest.type, equipped: true }, newBalance: 500 - cheapest.cost });
      expect(await balance(player.auth)).toBe(500 - cheapest.cost);
      expect((await items(player.auth)).find((i) => i.id === cheapest.id)).toMatchObject({ owned: true, equipped: true });
      expect(await ledger(player.id)).toMatchObject([{ amount: -cheapest.cost, type: 'spend', reason: 'purchase', referenceId: cheapest.id }]);

      const badges = (await api().get('/v1/users/me/badges').set('Authorization', player.auth)).body;
      expect(badges.find((b: { code: string }) => b.code === 'collector').earnedAt).not.toBeNull();

      await purchase(player.auth, cheapest.id).expect(409);
    });

    it('solo un artículo aplicado por tipo; se puede volver a aplicar uno ya comprado', async () => {
      const player = await registerPlayer(app, 'avatares');
      await setBalance(player.id, 5000);
      const avatars = (await items(player.auth)).filter((i) => i.type === 'avatar');
      expect(avatars).toHaveLength(2);
      for (const avatar of avatars) await purchase(player.auth, avatar.id).expect(201);

      const equipped = () => items(player.auth).then((list) => list.filter((i) => i.type === 'avatar' && i.equipped).map((i) => i.id));
      expect(await equipped()).toEqual([avatars[1].id]);
      await api().post(`/v1/store/items/${avatars[0].id}/equip`).set('Authorization', player.auth).expect(200);
      expect(await equipped()).toEqual([avatars[0].id]);
    });

    it('no se puede aplicar un artículo que no se ha comprado', async () => {
      const player = await registerPlayer(app, 'sincomprar');
      const [item] = await items(player.auth);
      await api().post(`/v1/store/items/${item.id}/equip`).set('Authorization', player.auth).expect(404);
    });

    it('responde 404 si el artículo no existe y 400 si el id no es un UUID', async () => {
      const player = await registerPlayer(app, 'noexiste');
      await purchase(player.auth, '00000000-0000-4000-8000-000000000000').expect(404);
      await purchase(player.auth, 'abc').expect(400);
    });

    it('TC-43: dos compras simultáneas no gastan dos veces el mismo saldo', async () => {
      const player = await registerPlayer(app, 'simultaneo');
      const list = await items(player.auth);
      const [a, b] = [list[0], list[1]];
      await setBalance(player.id, b.cost); // alcanza para cualquiera de las dos, no para ambas

      const results = await Promise.all([purchase(player.auth, a.id), purchase(player.auth, b.id)]);
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 400]);
      const bought = results.find((r) => r.status === 201)!.body.item.id === a.id ? a : b;
      expect(await balance(player.auth)).toBe(b.cost - bought.cost);
      expect((await ledger(player.id)).filter((t) => t.type === 'spend')).toHaveLength(1);
    });

    it('TC-43: la misma compra enviada dos veces a la vez se procesa una sola vez', async () => {
      const player = await registerPlayer(app, 'doble');
      const [cheapest] = await items(player.auth);
      await setBalance(player.id, cheapest.cost * 3);
      const results = await Promise.all([purchase(player.auth, cheapest.id), purchase(player.auth, cheapest.id)]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await balance(player.auth)).toBe(cheapest.cost * 2);
    });
  });

  it('Plan de Seguridad §7: más de 10 compras por minuto desde la misma IP responden 429', async () => {
    const player = await registerPlayer(app, 'rafaga');
    const [item] = await items(player.auth);
    const burst = await Promise.all(
      Array.from({ length: 11 }, () => api().post(`/v1/store/items/${item.id}/purchase`).set('Authorization', player.auth).set('X-Forwarded-For', '10.7.99.1')),
    );
    expect(burst.filter((r) => r.status === 429).length).toBeGreaterThanOrEqual(1);
  });

  describe('historial', () => {
    it('lista los movimientos del más reciente al más antiguo, paginados', async () => {
      const host = await registerPlayer(app, 'historial');
      await registerPlayer(app, 'amigo1', { referralCode: host.username });
      await registerPlayer(app, 'amigo2', { referralCode: host.username });

      const page1 = await api().get('/v1/credits/transactions?page=1&limit=1').set('Authorization', host.auth).expect(200);
      expect(page1.body).toMatchObject({ total: 2, page: 1, limit: 1 });
      expect(page1.body.data).toHaveLength(1);
      const page2 = await api().get('/v1/credits/transactions?page=2&limit=1').set('Authorization', host.auth).expect(200);
      expect(new Date(page1.body.data[0].createdAt) >= new Date(page2.body.data[0].createdAt)).toBe(true);
      await api().get('/v1/credits/transactions?limit=500').set('Authorization', host.auth).expect(400);
    });
  });
});
