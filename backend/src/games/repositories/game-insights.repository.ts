import { Game } from '../entities/game.entity';
import { Question } from '../entities/question.entity';

/**
 * Consultas de la pantalla Minijuegos del panel administrativo. Solo lee tablas de Games.
 * Fechas YYYY-MM-DD en la zona `tz`; los rangos incluyen ambos extremos.
 */
export abstract class GameInsightsRepository {
  /** Todos los minijuegos en el orden del catálogo, con las partidas iniciadas en el rango. */
  abstract performanceByGame(from: string, to: string, tz: string): Promise<
    Array<{ gameId: string; name: string; translations: Game['translations']; icon: string; completed: number; abandoned: number; correct: number; questions: number }>
  >;
  abstract scoreDistribution(gameId: string, from: string, to: string, tz: string): Promise<Array<{ score: number; sessions: number }>>;
  abstract hardestQuestions(from: string, to: string, tz: string, limit: number, minAnswers: number): Promise<
    Array<{ question: Pick<Question, 'id' | 'statement' | 'correctAnswer' | 'translations'>; gameId: string; gameName: string; gameTranslations: Game['translations']; answers: number; correct: number }>
  >;
  abstract dailyChallengePlayers(from: string, to: string, tz: string): Promise<Array<{ date: string; players: number }>>;
  abstract sessionsByLocale(from: string, to: string, tz: string): Promise<Array<{ locale: string; sessions: number }>>;
}
