import { Locale } from '../shared/i18n/locale';
import { GameCategory } from './enums';

export type Trend = 'up' | 'down' | 'flat';

/**
 * Interfaz pública de Games para las métricas generales del panel administrativo (Dashboard,
 * Analytics y Reportes): partidas completadas, precisión, XP, categorías y ranking. Fechas
 * YYYY-MM-DD en APP_TIMEZONE; los rangos incluyen ambos extremos y sin rango significa "de
 * todos los tiempos". La pantalla Minijuegos usa GameInsightsReader y el detalle de un jugador,
 * GamesByPlayerReader.
 */
export abstract class GamesStatsReader {
  abstract totals(from?: string, to?: string): Promise<{ games: number; correct: number; questions: number; xp: number; accuracy: number | null }>;
  /** Respuestas registradas, incluidas las de partidas sin terminar. */
  abstract answersCount(): Promise<number>;
  /** Máximo de partidas completadas en un solo día anterior a `date` (alerta de récord). */
  abstract maxDailyGamesBefore(date: string): Promise<number>;
  /** Minijuegos más jugados (nombre en `locale`), con tendencia de los últimos 7 días contra los 7 anteriores. */
  abstract ranking(limit: number, today: string, locale: Locale): Promise<Array<{ gameId: string; name: string; icon: string; plays: number; avgScore: number; trend: Trend }>>;
  /** Partidas y precisión de cada categoría (todas, aunque tengan 0). */
  abstract byCategory(from?: string, to?: string): Promise<Array<{ category: GameCategory; games: number; accuracy: number | null }>>;
  abstract topPlayersByXp(from: string, to: string, limit: number): Promise<Array<{ userId: string; xp: number; accuracy: number | null; games: number }>>;
  /** Por día del rango (incluidos los días sin partidas): partidas completadas, XP y precisión. */
  abstract dailyGamesAndXp(from: string, to: string): Promise<Array<{ date: string; games: number; xp: number; accuracy: number | null }>>;
}
