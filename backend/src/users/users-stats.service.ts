import { Injectable } from '@nestjs/common';
import { AppClock } from '../shared/time/app-clock';
import { addDays } from '../shared/time/app-date';
import { UsersStatsRepository } from './repositories/users-stats.repository';
import { UsersStatsReader } from './users-stats.reader';

/** Rangos de duración de sesión de AdminAnalyticsScreen (RF-143) y sus límites en segundos. */
export const SESSION_BUCKETS = ['<2m', '2-5m', '5-10m', '10-20m', '>20m'] as const;
const SESSION_BUCKET_BOUNDS_SECONDS = [120, 300, 600, 1200];

/**
 * Implementación de UsersStatsReader: métricas de registros y actividad (USER_SESSION) para el
 * panel administrativo. Todas las fechas son YYYY-MM-DD en APP_TIMEZONE; los rangos incluyen
 * ambos extremos. Solo cuentan los jugadores: los administradores no aparecen en las métricas.
 */
@Injectable()
export class UsersStatsService extends UsersStatsReader {
  constructor(
    private readonly stats: UsersStatsRepository,
    private readonly clock: AppClock,
  ) {
    super();
  }

  private get tz(): string {
    return this.clock.timeZone;
  }

  /** Jugadores registrados hasta el final del día indicado (inclusive). */
  countPlayersUntil(date: string): Promise<number> {
    return this.stats.countPlayersUntil(date, this.tz);
  }

  // ---------- Actividad (USER_SESSION) ----------

  /** Usuarios activos por día (una sesión cuenta en cada día que abarca). RF-125. */
  dailyActiveUsers(from: string, to: string): Promise<Array<{ date: string; users: number }>> {
    return this.stats.dailyActiveUsers(from, to, this.tz);
  }

  /** Usuarios distintos con actividad en el rango. */
  distinctActiveUsers(from: string, to: string): Promise<number> {
    return this.stats.distinctActiveUsers(from, to, this.tz);
  }

  /** Duración media de las sesiones que empezaron en el rango, en minutos con un decimal (RF-138). */
  async averageSessionMinutes(from: string, to: string): Promise<number> {
    return Math.round((await this.stats.averageSessionMinutes(from, to, this.tz)) * 10) / 10;
  }

  /** Porcentaje de sesiones en cada rango de duración (RF-143). */
  async sessionDurationDistribution(from: string, to: string): Promise<Array<{ range: string; pct: number }>> {
    const rows = await this.stats.sessionCountsByDuration(from, to, this.tz, SESSION_BUCKET_BOUNDS_SECONDS);
    const total = rows.reduce((sum, r) => sum + r.sessions, 0);
    return SESSION_BUCKETS.map((range, i) => {
      const n = rows.find((r) => r.bucket === i)?.sessions ?? 0;
      return { range, pct: total ? Math.round((n / total) * 1000) / 10 : 0 };
    });
  }

  /** Sesiones iniciadas por hora del día (0-23) en el rango (RF-152). */
  async sessionsByHour(from: string, to: string): Promise<number[]> {
    const rows = await this.stats.sessionsByHour(from, to, this.tz);
    return Array.from({ length: 24 }, (_, hour) => rows.find((r) => r.hour === hour)?.sessions ?? 0);
  }

  /**
   * Retención al día N (RF-140): de los jugadores que se registraron entre cohortFrom y cohortTo
   * y ya llevan al menos N días registrados, qué porcentaje volvió a tener actividad el día N o
   * después. null si todavía no hay jugadores que cumplan N días.
   */
  async retention(day: number, cohortFrom: string, cohortTo: string): Promise<number | null> {
    const lastEligible = addDays(this.clock.today(), -day);
    const to = cohortTo < lastEligible ? cohortTo : lastEligible;
    const { eligible, retained } = await this.stats.retentionCohort(day, cohortFrom, to, this.tz);
    return eligible ? Math.round((retained / eligible) * 1000) / 10 : null;
  }

  /** Jugadores nuevos y activos de cada uno de los últimos `months` meses (RF-139). */
  monthlyGrowth(months: number): Promise<Array<{ month: string; newUsers: number; activeUsers: number }>> {
    return this.stats.monthlyGrowth(months, this.tz);
  }

  // ---------- Registros y activación ----------

  signupsByDay(from: string, to: string): Promise<Array<{ date: string; users: number }>> {
    return this.stats.signupsByDay(from, to, this.tz);
  }

  playerIdsRegistered(from: string, to: string): Promise<string[]> {
    return this.stats.playerIdsRegistered(from, to, this.tz);
  }

  countReturnedWithin(userIds: string[], days: number): Promise<number> {
    return this.stats.countReturnedWithin(userIds, days, this.tz);
  }

  activityHeatmap(from: string, to: string): Promise<Array<{ weekday: number; hour: number; sessions: number }>> {
    return this.stats.activityHeatmap(from, to, this.tz);
  }

}
