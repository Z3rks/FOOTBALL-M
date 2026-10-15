import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { GameCategory } from '../enums';
import { GamesByPlayerRepository } from './games-by-player.repository';
import { CompletedTotals } from './games-stats.repository';

@Injectable()
export class TypeOrmGamesByPlayerRepository extends TypeOrmRepository implements GamesByPlayerRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async completedGames(userId: string): Promise<number> {
    const [row] = await this.manager.query(`SELECT COUNT(*)::int AS n FROM game_sessions WHERE user_id = $1 AND status = 'completed'`, [userId]);
    return row.n;
  }

  async completedGamesByPlayer(userIds: string[]) {
    if (userIds.length === 0) return [];
    const rows: Array<{ user_id: string; games: number }> = await this.manager.query(
      `SELECT user_id, COUNT(*)::int AS games FROM game_sessions WHERE status = 'completed' AND user_id = ANY($1) GROUP BY user_id`,
      [userIds],
    );
    return rows.map((r) => ({ userId: r.user_id, games: r.games }));
  }

  async dailyXp(userId: string, from: string, to: string, tz: string) {
    const rows: Array<{ day: string; xp: number }> = await this.manager.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(SUM(s.xp_earned), 0)::int AS xp
       FROM generate_series($2::date, $3::date, interval '1 day') AS d
       LEFT JOIN game_sessions s ON s.user_id = $4 AND s.status = 'completed' AND (s.completed_at AT TIME ZONE $1)::date = d::date
       GROUP BY d ORDER BY d`,
      [tz, from, to, userId],
    );
    return rows.map((r) => ({ date: r.day, xp: r.xp }));
  }

  totalsByCategory(userId: string): Promise<Array<{ category: GameCategory } & CompletedTotals>> {
    return this.manager.query(
      `SELECT g.category, COUNT(s.id)::int AS games, COALESCE(SUM(s.score), 0)::int AS correct,
              COALESCE(SUM(s.total_questions), 0)::int AS questions, COALESCE(SUM(s.xp_earned), 0)::int AS xp
       FROM game_sessions s JOIN games g ON g.id = s.game_id
       WHERE s.user_id = $1 AND s.status = 'completed'
       GROUP BY g.category`,
      [userId],
    );
  }
}
