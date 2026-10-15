import { GameCategory } from './enums';

/**
 * Interfaz pública de Games para el panel administrativo: las partidas de jugadores concretos
 * ("Ver perfil" de AdminUsersScreen y el embudo de activación de Analytics). No confundir con
 * PlayerGameStatsReader, que usa Users para el perfil del propio jugador.
 */
export abstract class GamesByPlayerReader {
  /** Partidas completadas por un jugador. */
  abstract completedGames(userId: string): Promise<number>;
  /** Partidas completadas de cada jugador indicado (los que no jugaron no aparecen). */
  abstract completedGamesByPlayer(userIds: string[]): Promise<Array<{ userId: string; games: number }>>;
  /** XP ganada por un jugador cada día del rango (YYYY-MM-DD en APP_TIMEZONE). */
  abstract dailyXp(userId: string, from: string, to: string): Promise<Array<{ date: string; xp: number }>>;
  /** Precisión de un jugador en cada categoría (todas, null si no la jugó). */
  abstract accuracyByCategory(userId: string): Promise<Array<{ category: GameCategory; accuracy: number | null }>>;
}
