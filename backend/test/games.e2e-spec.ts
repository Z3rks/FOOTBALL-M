import { EventEmitter2 } from '@nestjs/event-emitter';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { GameSession } from '../src/games/entities/game-session.entity';
import { DomainEvents, GameCompletedEvent, ResultSharedEvent } from '../src/shared/events/domain-events';
import { answerAll, correctAnswers as correctAnswersOf, createTestApp, deleteE2eUsers, registerPlayer } from './utils';

/**
 * Pruebas e2e del módulo Games contra PostgreSQL real. Requieren `npm run db:up`,
 * `npm run migration:run` y `npm run seed` (usan el catálogo real de minijuegos).
 */
describe('Games (e2e)', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  let player: { id: string; auth: string };
  let other: { id: string; auth: string };
  let catalog: Array<{ id: string; name: string; difficulty: string }>;
  const completedEvents: GameCompletedEvent[] = [];
  const sharedEvents: ResultSharedEvent[] = [];

  const api = () => request(app.getHttpServer());
  const start = (gameId: string, auth: string, body: object = {}) => api().post(`/v1/games/${gameId}/sessions`).set('Authorization', auth).send(body);
  const answer = (sessionId: string, auth: string, questionNumber: number, value: string) =>
    api().post(`/v1/games/sessions/${sessionId}/answers`).set('Authorization', auth).send({ questionNumber, answer: value });
  const finish = (sessionId: string, auth: string, body: object) => api().patch(`/v1/games/sessions/${sessionId}`).set('Authorization', auth).send(body);
  const result = (sessionId: string, auth: string) => api().get(`/v1/games/sessions/${sessionId}`).set('Authorization', auth);

  const correctAnswers = (sessionId: string) => correctAnswersOf(db, sessionId);
  const play = (sessionId: string, auth: string) => answerAll(app, db, sessionId, auth);

  beforeAll(async () => {
    ({ app, db } = await createTestApp());
    const events = app.get(EventEmitter2);
    events.on(DomainEvents.GAME_COMPLETED, (e: GameCompletedEvent) => completedEvents.push(e));
    events.on(DomainEvents.RESULT_SHARED, (e: ResultSharedEvent) => sharedEvents.push(e));
    player = await registerPlayer(app, 'gamer');
    other = await registerPlayer(app, 'otro');
    catalog = (await api().get('/v1/games').set('Authorization', player.auth).expect(200)).body;
  });

  afterAll(async () => {
    await deleteE2eUsers(db);
    await app.close();
  });

  describe('catálogo', () => {
    it('TC-15: lista los 10 minijuegos en el orden de MinigamesScreen, sin datos internos', async () => {
      expect(catalog).toHaveLength(10);
      expect(catalog[0]).toEqual({ id: expect.any(String), name: 'Who is it?', description: expect.any(String), category: 'Players', difficulty: 'Easy', icon: 'user-search' });
      expect(catalog.at(-1)!.name).toBe('Goal or No Goal?');
      expect(catalog[0]).not.toHaveProperty('strategyKey');
    });

    it('exige sesión', () => api().get('/v1/games').expect(401));
  });

  describe('partida', () => {
    let sessionId: string;
    let total: number;

    it('TC-16: inicia una partida con preguntas sin la respuesta correcta', async () => {
      const res = await start(catalog[0].id, player.auth).expect(201);
      sessionId = res.body.sessionId;
      total = res.body.totalQuestions;

      expect(total).toBeGreaterThan(0);
      expect(res.body.questions).toHaveLength(total);
      expect(res.body.questions[0]).toEqual({ questionNumber: 1, statement: expect.any(String), options: expect.any(Array), mediaUrl: null, details: { clues: expect.any(Array) } });
      expect(JSON.stringify(res.body)).not.toMatch(/correctAnswer/);
    });

    it('responde 404 si el minijuego no existe y 400 si el id no es un UUID', async () => {
      await start('00000000-0000-4000-8000-000000000000', player.auth).expect(404);
      await start('no-es-uuid', player.auth).expect(400);
    });

    it('revela si la respuesta fue correcta solo después de responder', async () => {
      const [first] = await correctAnswers(sessionId);
      const res = await answer(sessionId, player.auth, 1, `  ${first.toUpperCase()} `).expect(201);
      expect(res.body).toEqual({ questionNumber: 1, isCorrect: true, correctAnswer: first, answeredCount: 1, totalQuestions: total });
    });

    it('no permite responder dos veces la misma pregunta', () => answer(sessionId, player.auth, 1, 'otra').expect(409));

    it('rechaza un número de pregunta fuera de la partida', () => answer(sessionId, player.auth, total + 1, 'x').expect(400));

    it('TC-37: tras una desconexión, GET devuelve lo ya respondido y las preguntas para continuar', async () => {
      const res = await result(sessionId, player.auth).expect(200);
      expect(res.body).toMatchObject({ status: 'in_progress', answeredCount: 1, answers: [{ questionNumber: 1, isCorrect: true }] });
      expect(res.body.questions).toHaveLength(total);
    });

    it('otro usuario no puede ver ni jugar la partida (404)', async () => {
      await result(sessionId, other.auth).expect(404);
      await answer(sessionId, other.auth, 2, 'x').expect(404);
    });

    it('TC-42: el cliente no puede enviar el puntaje', () => finish(sessionId, player.auth, { status: 'completed', score: 99 }).expect(400));

    it('no se puede completar sin responder todas las preguntas', () => finish(sessionId, player.auth, { status: 'completed' }).expect(409));

    it('TC-17/TC-18: al completar, el servidor calcula puntaje, precisión, XP y la cuadrícula', async () => {
      const correct = await correctAnswers(sessionId);
      await answer(sessionId, player.auth, 2, 'Respuesta equivocada').expect(201);
      for (let n = 3; n <= total; n++) await answer(sessionId, player.auth, n, correct[n - 1]).expect(201);

      const res = await finish(sessionId, player.auth, { status: 'completed' }).expect(200);
      const score = total - 1;
      expect(res.body).toMatchObject({
        status: 'completed',
        score,
        correctCount: score,
        incorrectCount: 1,
        accuracy: Math.round((score / total) * 10_000) / 100,
        xpEarned: score * 10, // "Who is it?" es Easy: 10 XP por acierto
        funFact: expect.any(String),
      });
      expect(res.body.answers.map((a: { isCorrect: boolean }) => a.isCorrect)).toEqual(Array.from({ length: total }, (_, i) => i !== 1));
      expect(res.body).not.toHaveProperty('questions');
    });

    it('emite GameCompletedEvent una sola vez, aunque se intente completar de nuevo', async () => {
      await finish(sessionId, player.auth, { status: 'completed' }).expect(409);
      const events = completedEvents.filter((e) => e.sessionId === sessionId);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ userId: player.id, score: total - 1, totalQuestions: total, isDailyChallenge: false });
    });

    it('RF-099: compartir genera el texto con la cuadrícula; los créditos solo la primera vez', async () => {
      const first = await api().post(`/v1/games/sessions/${sessionId}/share`).set('Authorization', player.auth).expect(200);
      expect(first.body.firstShare).toBe(true);
      expect(first.body.shareText).toContain('🟥');
      const second = await api().post(`/v1/games/sessions/${sessionId}/share`).set('Authorization', player.auth).expect(200);
      expect(second.body.firstShare).toBe(false);
      expect(sharedEvents.filter((e) => e.sessionId === sessionId)).toHaveLength(1);
    });

    it('TC-19: "Play Again" crea una partida nueva del mismo minijuego', async () => {
      const again = await start(catalog[0].id, player.auth).expect(201);
      expect(again.body.sessionId).not.toBe(sessionId);
      expect(again.body.game.id).toBe(catalog[0].id);
    });
  });

  describe('estilos propios de cada minijuego', () => {
    it('la partida indica su estilo y juzga el orden completo; los años se revelan al responder', async () => {
      const timeline = catalog.find((g) => g.name === 'Timeline')!;
      const { body } = await start(timeline.id, player.auth).expect(201);
      expect(body.playStyle).toBe('timeline');
      expect(body.questions[0].options).toHaveLength(4);

      const [first, second] = await correctAnswers(body.sessionId);
      const ordered = (JSON.parse(first) as Array<[string, number]>).map(([event]) => event);
      const res = await answer(body.sessionId, player.auth, 1, JSON.stringify(ordered)).expect(201);
      expect(res.body.isCorrect).toBe(true);
      expect(JSON.parse(res.body.correctAnswer)[0]).toEqual([ordered[0], expect.any(Number)]);

      const wrong = (JSON.parse(second) as Array<[string, number]>).map(([event]) => event).reverse();
      expect((await answer(body.sessionId, player.auth, 2, JSON.stringify(wrong)).expect(201)).body.isCorrect).toBe(false);

      expect((await result(body.sessionId, player.auth).expect(200)).body.playStyle).toBe('timeline'); // al retomar la partida
      await finish(body.sessionId, player.auth, { status: 'abandoned' }).expect(200);
    });

    it('cada minijuego indica su propio estilo', async () => {
      const { body } = await start(catalog[0].id, other.auth).expect(201);
      expect(body.playStyle).toBe('clues');
      await finish(body.sessionId, other.auth, { status: 'abandoned' }).expect(200);
    });
  });

  describe('idiomas (Accept-Language)', () => {
    const varGame = () => catalog.find((g) => g.name === 'Goal or No Goal?')!;
    // Las preguntas salen al azar: unas son de gol y otras de fuera de juego.
    const VAR_OPTIONS = { en: [['Goal', 'No goal'], ['Offside', 'Onside']], es: [['Gol', 'No gol'], ['Fuera de juego', 'Posición válida']] };

    it('TC-59: el catálogo sale en inglés por defecto y en español si se pide', async () => {
      expect(catalog[0].name).toBe('Who is it?');
      const { body } = await api().get('/v1/games').set('Authorization', player.auth).set('Accept-Language', 'es-CO,es;q=0.9').expect(200);
      expect(body[0].name).toBe('¿Quién es?');
      expect(body.map((g: { id: string }) => g.id)).toEqual(catalog.map((g) => g.id)); // mismos minijuegos, mismo orden
    });

    it('TC-59: la partida se muestra y se corrige en el idioma en que empezó', async () => {
      const en = (await start(varGame().id, player.auth).expect(201)).body;
      expect(VAR_OPTIONS.en).toContainEqual(en.questions[0].options);
      expect(en.game.name).toBe('Goal or No Goal?');

      const es = (await start(varGame().id, other.auth).set('Accept-Language', 'es').expect(201)).body;
      expect(VAR_OPTIONS.es).toContainEqual(es.questions[0].options);
      expect(es.game.name).toBe('¿Gol o no gol?');

      // Aunque se retome la partida pidiendo otro idioma, sigue en el suyo.
      const resumed = await result(es.sessionId, other.auth).set('Accept-Language', 'en').expect(200);
      expect(resumed.body.questions[0].options).toEqual(es.questions[0].options);

      for (const [session, auth] of [[en, player.auth], [es, other.auth]] as const) {
        const [correct] = await correctAnswers(session.sessionId);
        const res = await answer(session.sessionId, auth, 1, correct).expect(201);
        expect(res.body.isCorrect).toBe(true);
        expect(JSON.parse(res.body.correctAnswer).w.length).toBeGreaterThan(20); // la explicación, en el idioma de la partida
        await finish(session.sessionId, auth, { status: 'abandoned' }).expect(200);
      }
    });
  });

  describe('abandonar y vencer', () => {
    it('TC-40: una partida abandonada no da XP ni acepta más respuestas', async () => {
      const { body } = await start(catalog[1].id, player.auth).expect(201);
      const res = await finish(body.sessionId, player.auth, { status: 'abandoned' }).expect(200);
      expect(res.body.status).toBe('abandoned');
      expect(res.body).not.toHaveProperty('xpEarned');
      await answer(body.sessionId, player.auth, 1, 'x').expect(409);
      expect(completedEvents.some((e) => e.sessionId === body.sessionId)).toBe(false);
    });

    it('una partida abierta más de 30 minutos queda abandonada al intentar responder', async () => {
      const { body } = await start(catalog[2].id, player.auth).expect(201);
      await db.getRepository(GameSession).update({ id: body.sessionId }, { startedAt: new Date(Date.now() - 31 * 60_000) });
      const res = await answer(body.sessionId, player.auth, 1, 'x').expect(409);
      expect(res.body.message).toBe('Session expired');
      expect((await result(body.sessionId, player.auth)).body.status).toBe('abandoned');
    });
  });

  describe('TC-12: reto diario', () => {
    let challenge: { game: { id: string; difficulty: string }; xpReward: number; completedToday: boolean };
    const daily = () => registerPlayer(app, 'retador');

    beforeAll(async () => {
      challenge = (await api().get('/v1/games/daily-challenge').set('Authorization', player.auth).expect(200)).body;
    });

    it('muestra el reto del día (RF-059)', () => {
      expect(challenge).toMatchObject({ title: 'Football Trivia Blitz', xpReward: 50, creditsReward: 50, completedToday: false });
      expect(catalog.map((g) => g.id)).toContain(challenge.game.id);
    });

    it('solo se puede jugar como reto el minijuego del día', async () => {
      const wrongGame = catalog.find((g) => g.id !== challenge.game.id)!;
      await start(wrongGame.id, player.auth, { dailyChallenge: true }).expect(400);
    });

    it('completar el reto suma +50 XP una sola vez por día', async () => {
      const retador = await daily();
      const first = await start(challenge.game.id, retador.auth, { dailyChallenge: true }).expect(201);
      // Una segunda partida del reto abierta a la vez (ej. en otra pestaña).
      const second = await start(challenge.game.id, retador.auth, { dailyChallenge: true }).expect(201);

      await play(first.body.sessionId, retador.auth);
      const done = await finish(first.body.sessionId, retador.auth, { status: 'completed' }).expect(200);
      const total = done.body.totalQuestions;
      const multiplier = { Easy: 1, Medium: 1.25, Hard: 1.5, Expert: 2 }[challenge.game.difficulty]!;
      expect(done.body).toMatchObject({ isDailyChallenge: true, xpEarned: Math.round(total * 10 * multiplier) + 50 });

      const status = await api().get('/v1/games/daily-challenge').set('Authorization', retador.auth).expect(200);
      expect(status.body.completedToday).toBe(true);
      await start(challenge.game.id, retador.auth, { dailyChallenge: true }).expect(409);

      // La segunda partida se completa como partida normal: sin bonus ni créditos del reto.
      await play(second.body.sessionId, retador.auth);
      const extra = await finish(second.body.sessionId, retador.auth, { status: 'completed' }).expect(200);
      expect(extra.body).toMatchObject({ isDailyChallenge: false, xpEarned: Math.round(total * 10 * multiplier) });
    });
  });
});
