import { Injectable } from '@nestjs/common';
import { AppClock } from '../shared/time/app-clock';
import { accuracyOf } from './accuracy';
import { GameCategory } from './enums';
import { GamesByPlayerReader } from './games-by-player.reader';
import { GamesByPlayerRepository } from './repositories/games-by-player.repository';

/** Implementación de GamesByPlayerReader (partidas de jugadores concretos para el panel administrativo). */
@Injectable()
export class GamesByPlayerService extends GamesByPlayerReader {
  constructor(
    private readonly players: GamesByPlayerRepository,
    private readonly clock: AppClock,
  ) {
    super();
  }

  completedGames(userId: string): Promise<number> {
    return this.players.completedGames(userId);
  }

  completedGamesByPlayer(userIds: string[]): Promise<Array<{ userId: string; games: number }>> {
    return this.players.completedGamesByPlayer(userIds);
  }

  dailyXp(userId: string, from: string, to: string): Promise<Array<{ date: string; xp: number }>> {
    return this.players.dailyXp(userId, from, to, this.clock.timeZone);
  }

  async accuracyByCategory(userId: string): Promise<Array<{ category: GameCategory; accuracy: number | null }>> {
    const rows = await this.players.totalsByCategory(userId);
    return Object.values(GameCategory).map((category) => {
      const row = rows.find((r) => r.category === category);
      return { category, accuracy: row ? accuracyOf(row.correct, row.questions) : null };
    });
  }
}
