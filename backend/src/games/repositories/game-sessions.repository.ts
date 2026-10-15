import { GameAnswer } from '../entities/game-answer.entity';
import { GameSession } from '../entities/game-session.entity';
import { Game } from '../entities/game.entity';
import { FunFact } from '../entities/fun-fact.entity';
import { Question } from '../entities/question.entity';
import { GameCategory } from '../enums';
import { PlayerGameStats } from '../player-game-stats.reader';
import { Locale } from '../../shared/i18n/locale';

export type SessionWithGame = GameSession & { game: Game };

export interface NewGameSession {
  userId: string;
  gameId: string;
  isDailyChallenge: boolean;
  totalQuestions: number;
  questionIds: string[];
  locale: Locale;
}

export interface NewGameAnswer {
  sessionId: string;
  questionId: string;
  questionNumber: number;
  givenAnswer: string;
  isCorrect: boolean;
}

export interface CompletedSessionResult {
  score: number;
  accuracy: number;
  xpEarned: number;
  isDailyChallenge: boolean;
  completedAt: Date;
}

/** Repositorio de las partidas (GAME_SESSION, GAME_ANSWER) y del banco de preguntas y datos curiosos. */
export abstract class GameSessionsRepository {
  /**
   * Procesa de a una las partidas de un mismo jugador hasta el final de la transacción
   * (usar dentro de UnitOfWork.run). No bloquea tablas de otros módulos.
   */
  abstract lockPlayer(userId: string): Promise<void>;
  abstract pickRandomQuestions(gameId: string, limit: number): Promise<Question[]>;
  abstract findQuestion(id: string): Promise<Question | null>;
  abstract findQuestionsByIds(ids: string[]): Promise<Question[]>;
  abstract create(session: NewGameSession): Promise<GameSession>;
  /** La partida con su minijuego, solo si es de ese usuario. */
  abstract findOwned(userId: string, sessionId: string): Promise<SessionWithGame | null>;
  /** Lanza UniqueConstraintError si esa pregunta ya se respondió. */
  abstract insertAnswer(answer: NewGameAnswer): Promise<void>;
  abstract countAnswers(sessionId: string): Promise<number>;
  /** Respuestas en orden de pregunta. */
  abstract listAnswers(sessionId: string): Promise<GameAnswer[]>;
  /** Cierra la partida como completada solo si sigue en curso. Devuelve si la cerró. */
  abstract completeIfInProgress(sessionId: string, result: CompletedSessionResult): Promise<boolean>;
  abstract abandonIfInProgress(sessionId: string): Promise<void>;
  /** Marca la partida como compartida. true solo la primera vez. */
  abstract markSharedIfFirst(sessionId: string): Promise<boolean>;
  /** ¿El usuario completó un reto diario el día `date` (YYYY-MM-DD en la zona `tz`)? */
  abstract hasCompletedDailyChallengeOn(userId: string, date: string, tz: string): Promise<boolean>;
  /** Resumen de las partidas completadas del jugador. */
  abstract playerStats(userId: string): Promise<Omit<PlayerGameStats, 'categoriesAvailable'>>;
  /** Un dato curioso, preferiblemente de la categoría; el mismo para la misma `seed`. */
  abstract pickFunFact(category: GameCategory, seed: string): Promise<FunFact | null>;
}
