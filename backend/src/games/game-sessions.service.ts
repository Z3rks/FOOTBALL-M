import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UniqueConstraintError } from '../shared/database/errors';
import { UnitOfWork } from '../shared/database/unit-of-work';
import { DEFAULT_LOCALE, Locale, localize } from '../shared/i18n/locale';
import { DomainEvents, GameCompletedEvent, ResultSharedEvent } from '../shared/events/domain-events';
import { GameSession } from './entities/game-session.entity';
import { Question } from './entities/question.entity';
import { GameSessionStatus } from './enums';
import { GamesService, toGameSummary } from './games.service';
import { GameSessionsRepository, SessionWithGame } from './repositories/game-sessions.repository';
import { GameFactory } from './strategies/game.factory';

/** Preguntas por partida (RF-095: cuadrícula de hasta 10). Si el banco tiene menos, se usan todas. */
export const QUESTIONS_PER_SESSION = 10;
/** Plan de Seguridad §6: una partida no puede quedar abierta indefinidamente. */
export const SESSION_MAX_MINUTES = 30;

/** Pregunta tal como la ve el jugador, en el idioma de la partida y sin la respuesta correcta. */
function toPublicQuestion(original: Question, index: number, locale: Locale) {
  const question = localize(original, locale);
  return { questionNumber: index + 1, statement: question.statement, options: question.options, mediaUrl: question.mediaUrl, details: question.details };
}

/** Flujo de una partida: iniciar, responder, cerrar, ver resultado y compartir (Contrato de API §7). */
@Injectable()
export class GameSessionsService {
  constructor(
    private readonly sessions: GameSessionsRepository,
    private readonly games: GamesService,
    private readonly factory: GameFactory,
    private readonly events: EventEmitter2,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * POST /games/:id/sessions — RF-087, RF-088, RF-100/102 (Play Again) y RF-061/062 (reto diario).
   * La partida queda en el idioma pedido: así se corrige en el mismo idioma en que se mostró.
   */
  async start(userId: string, gameId: string, dailyChallenge = false, locale: Locale = DEFAULT_LOCALE) {
    const game = await this.games.findGameOrFail(gameId);

    if (dailyChallenge) {
      const challenge = await this.games.getOrCreateTodayChallenge();
      if (challenge.gameId !== game.id) throw new BadRequestException("This game is not today's daily challenge");
      if (await this.games.hasCompletedDailyChallengeToday(userId)) throw new ConflictException('Daily challenge already completed today');
    }

    const picked = await this.sessions.pickRandomQuestions(game.id, QUESTIONS_PER_SESSION);
    if (picked.length === 0) throw new ConflictException('This game has no questions yet');

    const session = await this.sessions.create({
      userId,
      gameId: game.id,
      isDailyChallenge: dailyChallenge,
      totalQuestions: picked.length,
      questionIds: picked.map((q) => q.id),
      locale,
    });
    return {
      sessionId: session.id,
      game: toGameSummary(game, locale),
      playStyle: this.factory.forGame(game).playStyle,
      isDailyChallenge: session.isDailyChallenge,
      totalQuestions: session.totalQuestions,
      expiresAt: this.expiresAt(session),
      questions: picked.map((q, i) => toPublicQuestion(q, i, locale)),
    };
  }

  /**
   * POST /games/sessions/:id/answers — RF-089, RF-095/096. Cada respuesta se guarda al
   * momento (RNF-DISP-03). La respuesta correcta solo se revela después de responder.
   */
  async answer(userId: string, sessionId: string, questionNumber: number, answer: string) {
    const session = await this.findOwnedOrFail(userId, sessionId);
    await this.assertPlayable(session);
    if (questionNumber > session.totalQuestions) throw new BadRequestException(`questionNumber must be between 1 and ${session.totalQuestions}`);

    const stored = await this.sessions.findQuestion(session.questionIds[questionNumber - 1]);
    if (!stored) throw new NotFoundException('Question not found');
    // Las estrategias reciben la pregunta ya en el idioma de la partida: no saben de idiomas.
    const question = localize(stored, session.locale);
    const isCorrect = this.factory.forGame(session.game).isCorrect(question, answer);
    try {
      await this.sessions.insertAnswer({ sessionId, questionId: question.id, questionNumber, givenAnswer: answer, isCorrect });
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new ConflictException('Question already answered');
      throw error;
    }
    return {
      questionNumber,
      isCorrect,
      correctAnswer: question.correctAnswer,
      answeredCount: await this.sessions.countAnswers(sessionId),
      totalQuestions: session.totalQuestions,
    };
  }

  /** PATCH /games/sessions/:id — cierra la partida como completada (RF-089 a RF-093) o abandonada (RF-090). */
  async finish(userId: string, sessionId: string, status: GameSessionStatus.COMPLETED | GameSessionStatus.ABANDONED) {
    const session = await this.findOwnedOrFail(userId, sessionId);
    if (status === GameSessionStatus.ABANDONED) {
      await this.sessions.abandonIfInProgress(session.id);
      if (session.status !== GameSessionStatus.IN_PROGRESS) throw new ConflictException('Session is not in progress');
      return this.getResult(userId, sessionId);
    }

    await this.assertPlayable(session);
    const answers = await this.sessions.listAnswers(sessionId);
    if (answers.length < session.totalQuestions) throw new ConflictException('All questions must be answered before completing');

    const score = answers.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((score / session.totalQuestions) * 10_000) / 100;
    const completedAt = new Date();

    const event = await this.unitOfWork.run(async () => {
      // Las partidas de un jugador se cierran de a una, así el reto diario se premia una sola vez
      // aunque haya dos partidas del reto abiertas a la vez.
      await this.sessions.lockPlayer(userId);

      let isDailyChallenge = session.isDailyChallenge;
      let bonusXp = 0;
      if (isDailyChallenge) {
        if (await this.games.hasCompletedDailyChallengeToday(userId)) isDailyChallenge = false;
        else bonusXp = (await this.games.getOrCreateTodayChallenge()).xpReward;
      }
      const xpEarned = this.factory.forGame(session.game).xpFor(score, session.game.difficulty) + bonusXp;

      // Si dos peticiones completan la misma partida, solo una la cierra y la premia.
      const closed = await this.sessions.completeIfInProgress(session.id, { score, accuracy, xpEarned, isDailyChallenge, completedAt });
      if (!closed) throw new ConflictException('Session is not in progress');
      return new GameCompletedEvent(userId, session.id, session.gameId, session.game.category, score, session.totalQuestions, xpEarned, isDailyChallenge, completedAt);
    });

    // Se espera a Users/Credits para que el perfil ya esté actualizado al responder; cada listener captura sus errores.
    await this.events.emitAsync(DomainEvents.GAME_COMPLETED, event);
    return this.getResult(userId, sessionId);
  }

  /**
   * GET /games/sessions/:id — resultado (RF-091 a RF-098). Si la partida sigue en curso,
   * devuelve también sus preguntas para retomarla tras una desconexión (RNF-DISP-03, TC-37).
   */
  async getResult(userId: string, sessionId: string) {
    const session = await this.findOwnedOrFail(userId, sessionId);
    const answers = await this.sessions.listAnswers(sessionId);
    const base = {
      id: session.id,
      game: toGameSummary(session.game, session.locale),
      status: session.status,
      isDailyChallenge: session.isDailyChallenge,
      totalQuestions: session.totalQuestions,
      answeredCount: answers.length,
      answers: answers.map((a) => ({ questionNumber: a.questionNumber, isCorrect: a.isCorrect })),
    };

    if (session.status === GameSessionStatus.IN_PROGRESS) {
      const byId = new Map((await this.sessions.findQuestionsByIds(session.questionIds)).map((q) => [q.id, q]));
      return {
        ...base,
        playStyle: this.factory.forGame(session.game).playStyle,
        expiresAt: this.expiresAt(session),
        questions: session.questionIds.map((id, i) => toPublicQuestion(byId.get(id)!, i, session.locale)),
      };
    }
    if (session.status === GameSessionStatus.COMPLETED) {
      // Dato curioso de la misma categoría si hay; distinto entre partidas y estable para la misma (RF-097).
      const funFact = await this.sessions.pickFunFact(session.game.category, session.id);
      return {
        ...base,
        score: session.score,
        correctCount: session.score,
        incorrectCount: session.totalQuestions - (session.score ?? 0),
        accuracy: session.accuracy,
        xpEarned: session.xpEarned,
        completedAt: session.completedAt,
        funFact: funFact ? localize(funFact, session.locale).text : null,
      };
    }
    return base;
  }

  /** POST /games/sessions/:id/share — RF-099. Los +25 créditos (evento) solo la primera vez. */
  async share(userId: string, sessionId: string) {
    const session = await this.findOwnedOrFail(userId, sessionId);
    if (session.status !== GameSessionStatus.COMPLETED) throw new ConflictException('Only completed sessions can be shared');

    const answers = await this.sessions.listAnswers(sessionId);
    // Misma cuadrícula de 5 columnas que ResultsScreen (RF-095).
    const grid = answers.map((a) => (a.isCorrect ? '🟩' : '🟥')).join('').match(/.{1,5}/gu)?.join('\n') ?? '';
    const shareText = `⚽ Football Maestro — ${localize(session.game, session.locale).name}\n${session.score}/${session.totalQuestions} (${session.accuracy}%)\n${grid}`;

    const firstShare = await this.sessions.markSharedIfFirst(session.id);
    if (firstShare) await this.events.emitAsync(DomainEvents.RESULT_SHARED, new ResultSharedEvent(userId, session.id));
    return { shareText, firstShare };
  }

  /** Una partida de otro usuario responde 404, igual que una inexistente (no revela ids ajenos). */
  private async findOwnedOrFail(userId: string, sessionId: string): Promise<SessionWithGame> {
    const session = await this.sessions.findOwned(userId, sessionId);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  /** Solo se juega una partida en curso y dentro de su tiempo máximo; si venció, queda abandonada. */
  private async assertPlayable(session: GameSession): Promise<void> {
    if (session.status !== GameSessionStatus.IN_PROGRESS) throw new ConflictException('Session is not in progress');
    if (this.expiresAt(session) <= new Date()) {
      await this.sessions.abandonIfInProgress(session.id);
      throw new ConflictException('Session expired');
    }
  }

  private expiresAt(session: GameSession): Date {
    return new Date(session.startedAt.getTime() + SESSION_MAX_MINUTES * 60_000);
  }
}
