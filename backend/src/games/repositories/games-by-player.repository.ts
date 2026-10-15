import { GameCategory } from '../enums';
import { CompletedTotals } from './games-stats.repository';

/** Consultas de las partidas de jugadores concretos para el panel administrativo. Solo lee tablas de Games. */
export abstract class GamesByPlayerRepository {
  abstract completedGames(userId: string): Promise<number>;
  abstract completedGamesByPlayer(userIds: string[]): Promise<Array<{ userId: string; games: number }>>;
  abstract dailyXp(userId: string, from: string, to: string, tz: string): Promise<Array<{ date: string; xp: number }>>;
  /** Solo las categorías que el jugador jugó. */
  abstract totalsByCategory(userId: string): Promise<Array<{ category: GameCategory } & CompletedTotals>>;
}
