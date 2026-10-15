import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { GameCategory } from '../enums';
import { CompletedTotals, GamesStatsRepository } from './games-stats.repository';
import { Game } from '../entities/game.entity';

/** Partidas completadas en el rango $2..$3 (o de todos los tiempos si $2 es nulo), en la zona $1. */
const COMPLETED_IN_RANGE = `s.status = 'completed' AND ($2::date IS NULL OR (s.completed_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date)`;

@Injectable()
export class TypeOrmGamesStatsRepository extends TypeOrmRepository implements GamesStatsRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async totals(tz: string, from: string | null, to: string | null): Promise<CompletedTotals> {
    const [row] = await this.manager.query(
      `SELECT COUNT(*)::int AS games, COALESCE(SUM(s.score), 0)::int AS correct,
              COALESCE(SUM(s.total_questions), 0)::int AS questions, COALESCE(SUM(s.xp_earned), 0)::int AS xp
       FROM game_sessions s
       WHERE ${COMPLETED_IN_RANGE}`,
      [tz, from, to],
    );
    return row;
  }

  async answersCount(): Promise<number> {
    const [row] = await this.manager.query(`SELECT COUNT(*)::int AS n FROM game_answers`);
    return row.n;
  }

  async maxDailyGamesBefore(date: string, tz: string): Promise<number> {
    const [row] = await this.manager.query(
      `SELECT COALESCE(MAX(n), 0)::int AS n FROM (
         SELECT COUNT(*) AS n FROM game_sessions s
         WHERE s.status = 'completed' AND (s.completed_at AT TIME ZONE $1)::date < $2::date
         GROUP BY (s.completed_at AT TIME ZONE $1)::date
       ) t`,
      [tz, date],
    );
    return row.n;
  }

  async ranking(limit: number, today: string, tz: string) {
    const rows: Array<{ game_id: string; name: string; translations: Game['translations']; icon: string; plays: number; avg_score: number; recent: number; previous: number }> = await this.manager.query(
      `SELECT g.id AS game_id, g.name, g.translations, g.icon, COUNT(s.id)::int AS plays,
              COALESCE(ROUND(AVG(s.score)::numeric, 1), 0)::float AS avg_score,
              COUNT(s.id) FILTER (WHERE (s.completed_at AT TIME ZONE $1)::date > $2::date - 7)::int AS recent,
              COUNT(s.id) FILTER (WHERE (s.completed_at AT TIME ZONE $1)::date BETWEEN $2::date - 13 AND $2::date - 7)::int AS previous
       FROM games g
       LEFT JOIN game_sessions s ON s.game_id = g.id AND s.status = 'completed'
       GROUP BY g.id ORDER BY plays DESC, g.sort_order ASC LIMIT $3`,
      [tz, today, limit],
    );
    return rows.map((r) => ({ gameId: r.game_id, name: r.name, translations: r.translations, icon: r.icon, plays: r.plays, avgScore: r.avg_score, recent: r.recent, previous: r.previous }));
  }

  byCategory(tz: string, from: string | null, to: string | null): Promise<Array<{ category: GameCategory } & CompletedTotals>> {
    return this.manager.query(
      `SELECT g.category, COUNT(s.id)::int AS games, COALESCE(SUM(s.score), 0)::int AS correct,
              COALESCE(SUM(s.total_questions), 0)::int AS questions, COALESCE(SUM(s.xp_earned), 0)::int AS xp
       FROM game_sessions s JOIN games g ON g.id = s.game_id
       WHERE ${COMPLETED_IN_RANGE}
       GROUP BY g.category`,
      [tz, from, to],
    );
  }

  async topPlayersByXp(from: string, to: string, tz: string, limit: number) {
    const rows: Array<{ user_id: string } & CompletedTotals> = await this.manager.query(
      `SELECT s.user_id, COUNT(*)::int AS games, SUM(s.score)::int AS correct, SUM(s.total_questions)::int AS questions, SUM(s.xp_earned)::int AS xp
       FROM game_sessions s
       WHERE ${COMPLETED_IN_RANGE}
       GROUP BY s.user_id ORDER BY xp DESC, SUM(s.score)::float / NULLIF(SUM(s.total_questions), 0) DESC NULLS LAST, s.user_id
       LIMIT $4`,
      [tz, from, to, limit],
    );
    return rows.map(({ user_id, ...totals }) => ({ userId: user_id, ...totals }));
  }

  async dailyGamesAndXp(from: string, to: string, tz: string) {
    const rows: Array<{ day: string } & CompletedTotals> = await this.manager.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(s.id)::int AS games, COALESCE(SUM(s.xp_earned), 0)::int AS xp,
              COALESCE(SUM(s.score), 0)::int AS correct, COALESCE(SUM(s.total_questions), 0)::int AS questions
       FROM generate_series($2::date, $3::date, interval '1 day') AS d
       LEFT JOIN game_sessions s ON s.status = 'completed' AND (s.completed_at AT TIME ZONE $1)::date = d::date
       GROUP BY d ORDER BY d`,
      [tz, from, to],
    );
    return rows.map(({ day, ...totals }) => ({ date: day, ...totals }));
  }
}
