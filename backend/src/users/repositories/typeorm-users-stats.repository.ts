import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, In } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { PlayerFilter } from '../player-directory';
import { UsersStatsRepository } from './users-stats.repository';

/** Sesiones de uso de jugadores (los administradores no cuentan en las métricas). */
const PLAYER_SESSIONS = `user_sessions s JOIN users u ON u.id = s.user_id AND u.role = 'player'`;

@Injectable()
export class TypeOrmUsersStatsRepository extends TypeOrmRepository implements UsersStatsRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  private get users() {
    return this.manager.getRepository(User);
  }

  async searchPlayers(filter: PlayerFilter, search: string | undefined, page: number, limit: number) {
    const query = this.playersQuery(search);
    if (filter === 'active') query.andWhere('u.status = :status', { status: UserStatus.ACTIVE });
    if (filter === 'inactive') query.andWhere('u.status = :status', { status: UserStatus.INACTIVE });
    if (filter === 'new7d') query.andWhere("u.created_at >= now() - interval '7 days'");
    const [rows, total] = await query
      .orderBy('u.created_at', 'DESC')
      .addOrderBy('u.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { rows, total };
  }

  async countPlayersByFilter(search: string | undefined): Promise<Record<PlayerFilter, number>> {
    const row = await this.playersQuery(search)
      .select('COUNT(*)', 'all')
      .addSelect(`COUNT(*) FILTER (WHERE u.status = '${UserStatus.ACTIVE}')`, 'active')
      .addSelect(`COUNT(*) FILTER (WHERE u.status = '${UserStatus.INACTIVE}')`, 'inactive')
      .addSelect("COUNT(*) FILTER (WHERE u.created_at >= now() - interval '7 days')", 'new7d')
      .getRawOne<Record<PlayerFilter, string>>();
    return { all: Number(row?.all ?? 0), active: Number(row?.active ?? 0), inactive: Number(row?.inactive ?? 0), new7d: Number(row?.new7d ?? 0) };
  }

  findPlayer(id: string): Promise<User | null> {
    return this.users.findOneBy({ id, role: UserRole.PLAYER });
  }

  findPlayersByIds(ids: string[]): Promise<User[]> {
    return ids.length ? this.users.findBy({ id: In(ids), role: UserRole.PLAYER }) : Promise.resolve([]);
  }

  async countPlayersUntil(date: string, tz: string): Promise<number> {
    const [row] = await this.manager.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE role = 'player' AND (created_at AT TIME ZONE $1)::date <= $2::date`,
      [tz, date],
    );
    return row.n;
  }

  async lastActiveAt(userId: string): Promise<Date | null> {
    const [row] = await this.manager.query(`SELECT MAX(last_seen_at) AS at FROM user_sessions WHERE user_id = $1`, [userId]);
    return row.at ?? null;
  }

  async dailyActiveUsers(from: string, to: string, tz: string) {
    const rows: Array<{ day: string; users: number }> = await this.manager.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(DISTINCT s.user_id)::int AS users
       FROM generate_series($2::date, $3::date, interval '1 day') AS d
       LEFT JOIN (
         SELECT s.user_id, (s.started_at AT TIME ZONE $1)::date AS first_day, (s.last_seen_at AT TIME ZONE $1)::date AS last_day
         FROM ${PLAYER_SESSIONS}
       ) s ON d::date BETWEEN s.first_day AND s.last_day
       GROUP BY d ORDER BY d`,
      [tz, from, to],
    );
    return rows.map((r) => ({ date: r.day, users: r.users }));
  }

  async distinctActiveUsers(from: string, to: string, tz: string): Promise<number> {
    const [row] = await this.manager.query(
      `SELECT COUNT(DISTINCT s.user_id)::int AS n
       FROM ${PLAYER_SESSIONS}
       WHERE (s.started_at AT TIME ZONE $1)::date <= $3::date AND (s.last_seen_at AT TIME ZONE $1)::date >= $2::date`,
      [tz, from, to],
    );
    return row.n;
  }

  async averageSessionMinutes(from: string, to: string, tz: string): Promise<number> {
    const [row] = await this.manager.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s.last_seen_at - s.started_at))) / 60, 0)::float AS minutes
       FROM ${PLAYER_SESSIONS}
       WHERE (s.started_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date`,
      [tz, from, to],
    );
    return row.minutes;
  }

  async sessionCountsByDuration(from: string, to: string, tz: string, boundsSeconds: number[]) {
    // El grupo de cada sesión es cuántos límites alcanza su duración.
    const rows: Array<{ bucket: number; sessions: number }> = await this.manager.query(
      `SELECT (SELECT COUNT(*) FROM unnest($4::int[]) AS b WHERE t.d >= b)::int AS bucket, COUNT(*)::int AS sessions
       FROM (
         SELECT EXTRACT(EPOCH FROM (s.last_seen_at - s.started_at)) AS d
         FROM ${PLAYER_SESSIONS}
         WHERE (s.started_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
       ) t GROUP BY bucket`,
      [tz, from, to, boundsSeconds],
    );
    return rows;
  }

  sessionsByHour(from: string, to: string, tz: string): Promise<Array<{ hour: number; sessions: number }>> {
    return this.manager.query(
      `SELECT EXTRACT(HOUR FROM s.started_at AT TIME ZONE $1)::int AS hour, COUNT(*)::int AS sessions
       FROM ${PLAYER_SESSIONS}
       WHERE (s.started_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
       GROUP BY hour`,
      [tz, from, to],
    );
  }

  async retentionCohort(day: number, cohortFrom: string, cohortTo: string, tz: string) {
    const [row] = await this.manager.query(
      `SELECT COUNT(*)::int AS eligible,
              COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM user_sessions s
                WHERE s.user_id = c.id AND (s.last_seen_at AT TIME ZONE $1)::date >= c.signup + $4::int
              ))::int AS retained
       FROM (
         SELECT id, (created_at AT TIME ZONE $1)::date AS signup FROM users WHERE role = 'player'
       ) c
       WHERE c.signup BETWEEN $2::date AND $3::date`,
      [tz, cohortFrom, cohortTo, day],
    );
    return { eligible: row.eligible, retained: row.retained };
  }

  async monthlyGrowth(months: number, tz: string) {
    const rows: Array<{ month: string; new_users: number; active_users: number }> = await this.manager.query(
      `SELECT to_char(m, 'YYYY-MM') AS month,
              (SELECT COUNT(*)::int FROM users u
                 WHERE u.role = 'player' AND (u.created_at AT TIME ZONE $1) >= m AND (u.created_at AT TIME ZONE $1) < m + interval '1 month') AS new_users,
              (SELECT COUNT(DISTINCT s.user_id)::int FROM ${PLAYER_SESSIONS}
                 WHERE (s.started_at AT TIME ZONE $1) < m + interval '1 month' AND (s.last_seen_at AT TIME ZONE $1) >= m) AS active_users
       FROM generate_series(date_trunc('month', now() AT TIME ZONE $1) - make_interval(months => $2::int - 1),
                            date_trunc('month', now() AT TIME ZONE $1), interval '1 month') AS m
       ORDER BY m`,
      [tz, months],
    );
    return rows.map((r) => ({ month: r.month, newUsers: r.new_users, activeUsers: r.active_users }));
  }

  private playersQuery(search: string | undefined) {
    const query = this.users.createQueryBuilder('u').where('u.role = :role', { role: UserRole.PLAYER });
    if (search?.trim()) {
      // % y _ del texto buscado se escapan: se buscan literalmente.
      const pattern = `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      query.andWhere(new Brackets((q) => q.where('u.username ILIKE :pattern', { pattern }).orWhere('u.email ILIKE :pattern', { pattern })));
    }
    return query;
  }

  async signupsByDay(from: string, to: string, tz: string) {
    const rows: Array<{ day: string; users: number }> = await this.manager.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(u.id)::int AS users
       FROM generate_series($2::date, $3::date, interval '1 day') AS d
       LEFT JOIN users u ON u.role = 'player' AND (u.created_at AT TIME ZONE $1)::date = d::date
       GROUP BY d ORDER BY d`,
      [tz, from, to],
    );
    return rows.map((r) => ({ date: r.day, users: r.users }));
  }

  async playerIdsRegistered(from: string, to: string, tz: string): Promise<string[]> {
    const rows: Array<{ id: string }> = await this.manager.query(
      `SELECT id FROM users WHERE role = 'player' AND (created_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date`,
      [tz, from, to],
    );
    return rows.map((r) => r.id);
  }

  async countReturnedWithin(userIds: string[], days: number, tz: string): Promise<number> {
    if (userIds.length === 0) return 0;
    const [row] = await this.manager.query(
      `SELECT COUNT(DISTINCT u.id)::int AS n
       FROM users u JOIN user_sessions s ON s.user_id = u.id
       WHERE u.id = ANY($2)
         AND (s.started_at AT TIME ZONE $1)::date > (u.created_at AT TIME ZONE $1)::date
         AND (s.started_at AT TIME ZONE $1)::date <= (u.created_at AT TIME ZONE $1)::date + $3::int`,
      [tz, userIds, days],
    );
    return row.n;
  }

  activityHeatmap(from: string, to: string, tz: string): Promise<Array<{ weekday: number; hour: number; sessions: number }>> {
    return this.manager.query(
      `SELECT (EXTRACT(ISODOW FROM s.started_at AT TIME ZONE $1)::int - 1) AS weekday,
              EXTRACT(HOUR FROM s.started_at AT TIME ZONE $1)::int AS hour, COUNT(*)::int AS sessions
       FROM ${PLAYER_SESSIONS}
       WHERE (s.started_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
       GROUP BY 1, 2`,
      [tz, from, to],
    );
  }

}
