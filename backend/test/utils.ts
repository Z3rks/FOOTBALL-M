import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AdminAuditLog } from '../src/admin/audit/entities/admin-audit-log.entity';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { GameSession } from '../src/games/entities/game-session.entity';
import { Question } from '../src/games/entities/question.entity';
import { User } from '../src/users/entities/user.entity';
import { localize } from '../src/shared/i18n/locale';

/** Dominio de los usuarios creados por las pruebas e2e; se borran al terminar cada archivo. */
export const E2E_DOMAIN = '@e2e.test';
export const E2E_PASSWORD = 'supersecreta1';
/** Sufijo único por ejecución, para no chocar con datos de ejecuciones anteriores. */
export const RUN_ID = Date.now().toString(36);

/** App completa (misma configuración que producción). `customize` permite reemplazar proveedores. */
export async function createTestApp(customize: (builder: TestingModuleBuilder) => TestingModuleBuilder = (b) => b) {
  const moduleRef = await customize(Test.createTestingModule({ imports: [AppModule] })).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return { app, db: app.get(DataSource) };
}

/** Borra los usuarios de prueba (sus partidas, tokens y créditos se borran en cascada). */
export async function deleteE2eUsers(db: DataSource): Promise<void> {
  const testUsers = db.getRepository(User).createQueryBuilder('u').select('u.id').where('u.email LIKE :d', { d: `%${E2E_DOMAIN}` });
  await db
    .getRepository(AdminAuditLog)
    .createQueryBuilder()
    .delete()
    .where(`admin_user_id IN (${testUsers.getQuery()})`)
    .setParameters(testUsers.getParameters())
    .execute();
  await db.getRepository(User).createQueryBuilder().delete().where('email LIKE :d', { d: `%${E2E_DOMAIN}` }).execute();
}

/**
 * Respuesta correcta de cada pregunta de una partida, en el idioma de la partida, leída de la base
 * de datos (el cliente nunca la recibe).
 */
export async function correctAnswers(db: DataSource, sessionId: string): Promise<string[]> {
  const session = await db.getRepository(GameSession).findOneByOrFail({ id: sessionId });
  const questions = await db.getRepository(Question).findBy({ id: In(session.questionIds) });
  return session.questionIds.map((id) => localize(questions.find((q) => q.id === id)!, session.locale).correctAnswer);
}

/** Responde todas las preguntas de una partida: bien, salvo los números indicados en `wrong`. */
export async function answerAll(app: NestExpressApplication, db: DataSource, sessionId: string, auth: string, wrong: number[] = []) {
  const correct = await correctAnswers(db, sessionId);
  for (const [i, value] of correct.entries()) {
    await request(app.getHttpServer())
      .post(`/v1/games/sessions/${sessionId}/answers`)
      .set('Authorization', auth)
      .send({ questionNumber: i + 1, answer: wrong.includes(i + 1) ? 'Respuesta equivocada' : value })
      .expect(201);
  }
}

/** Inicia, responde y completa una partida. Devuelve el resultado (GET /games/sessions/:id). */
export async function playGame(app: NestExpressApplication, db: DataSource, auth: string, gameId: string, wrong: number[] = [], dailyChallenge = false) {
  const started = await request(app.getHttpServer()).post(`/v1/games/${gameId}/sessions`).set('Authorization', auth).send({ dailyChallenge }).expect(201);
  await answerAll(app, db, started.body.sessionId, auth, wrong);
  const done = await request(app.getHttpServer()).patch(`/v1/games/sessions/${started.body.sessionId}`).set('Authorization', auth).send({ status: 'completed' }).expect(200);
  return done.body as { id: string; score: number; totalQuestions: number; xpEarned: number; accuracy: number };
}

/** Registra un jugador de prueba y devuelve su id y un header Authorization listo para usar. */
export async function registerPlayer(app: NestExpressApplication, name: string, extra: { referralCode?: string } = {}) {
  const res = await request(app.getHttpServer())
    .post('/v1/auth/register')
    .set('X-Forwarded-For', `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`)
    .send({ username: `${name}_${RUN_ID}`.slice(0, 30), email: `${name}.${RUN_ID}${E2E_DOMAIN}`, password: E2E_PASSWORD, consentAccepted: true, ...extra })
    .expect(201);
  const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='))!;
  return {
    id: res.body.user.id as string,
    username: res.body.user.username as string,
    email: `${name}.${RUN_ID}${E2E_DOMAIN}`,
    auth: `Bearer ${res.body.accessToken}`,
    cookie,
  };
}
