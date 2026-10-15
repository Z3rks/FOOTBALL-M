import { Locale } from '../shared/i18n/locale';

/** Partidas de un minijuego iniciadas en el período, por resultado. */
export interface GamePerformance {
  gameId: string;
  name: string;
  icon: string;
  completed: number;
  abandoned: number;
  /** % de aciertos de las partidas completadas; null si no hubo. */
  accuracy: number | null;
}

/** Pregunta con su tasa de aciertos (las que menos se aciertan pueden estar mal redactadas). */
export interface QuestionDifficulty {
  questionId: string;
  gameId: string;
  gameName: string;
  statement: string;
  /** Respuesta correcta legible (null si no se puede resumir, ej. el orden de Timeline). */
  answer: string | null;
  answers: number;
  correctRate: number;
}

/**
 * Interfaz pública de Games para la pantalla Minijuegos del panel administrativo
 * (AdminGamesScreen): cómo se juega cada minijuego. Fechas YYYY-MM-DD en APP_TIMEZONE; los
 * rangos incluyen ambos extremos.
 */
export abstract class GameInsightsReader {
  /** Cada minijuego (en el orden del catálogo) con sus partidas completadas y abandonadas en el período. */
  abstract performanceByGame(from: string, to: string, locale: Locale): Promise<GamePerformance[]>;
  /** Cuántas partidas completadas de un minijuego sacaron cada puntaje (0 a 10). */
  abstract scoreDistribution(gameId: string, from: string, to: string): Promise<Array<{ score: number; sessions: number }>>;
  /** Las preguntas con menor tasa de aciertos en el período, con al menos `minAnswers` respuestas. */
  abstract hardestQuestions(from: string, to: string, limit: number, minAnswers: number, locale: Locale): Promise<QuestionDifficulty[]>;
  /** Jugadores que completaron el reto diario cada día del rango. */
  abstract dailyChallengePlayers(from: string, to: string): Promise<Array<{ date: string; players: number }>>;
  /** Partidas iniciadas en el período según su idioma. */
  abstract sessionsByLocale(from: string, to: string): Promise<Array<{ locale: string; sessions: number }>>;
}
