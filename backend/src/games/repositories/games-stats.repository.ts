import { GameCategory } from '../enums';
import { Game } from '../entities/game.entity';

export interface CompletedTotals {
  games: number;
  correct: number;
  questions: number;
  xp: number;
}

/**
 * Consultas de las métricas generales del panel administrativo sobre las partidas completadas.
 * Solo lee tablas de Games. Fechas YYYY-MM-DD en la zona `tz`; los rangos incluyen ambos
 * extremos y un rango nulo significa "de todos los tiempos".
 */
export abstract class GamesStatsRepository {
  abstract totals(tz: string, from: string | null, to: string | null): Promise<CompletedTotals>;
  /** Respuestas registradas, incluidas las de partidas sin terminar. */
  abstract answersCount(): Promise<number>;
  /** Máximo de partidas completadas en un solo día anterior a `date`. */
  abstract maxDailyGamesBefore(date: string, tz: string): Promise<number>;
  /** Minijuegos más jugados, con partidas de los 7 días hasta `today` (recent) y de los 7 anteriores (previous). */
  abstract ranking(limit: number, today: string, tz: string): Promise<Array<{ gameId: string; name: string; translations: Game['translations']; icon: string; plays: number; avgScore: number; recent: number; previous: number }>>;
  /** Solo las categorías con partidas. */
  abstract byCategory(tz: string, from: string | null, to: string | null): Promise<Array<{ category: GameCategory } & CompletedTotals>>;
  abstract topPlayersByXp(from: string, to: string, tz: string, limit: number): Promise<Array<{ userId: string } & CompletedTotals>>;
  /** Partidas, XP y aciertos de cada día del rango, incluidos los días sin partidas. */
  abstract dailyGamesAndXp(from: string, to: string, tz: string): Promise<Array<{ date: string } & CompletedTotals>>;
}
