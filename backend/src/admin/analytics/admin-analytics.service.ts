import { Injectable } from '@nestjs/common';
import { GamesByPlayerReader } from '../../games/games-by-player.reader';
import { GamesStatsReader } from '../../games/games-stats.reader';
import { addDays } from '../../shared/time/app-date';
import { AppClock } from '../../shared/time/app-clock';
import { PlayersBreakdownReader } from '../../users/players-breakdown.reader';
import { UsersStatsReader } from '../../users/users-stats.reader';
import { periodRange } from '../period';

/** Días de la curva de retención (RF-140). */
export const RETENTION_DAYS = [1, 3, 7, 14, 30];
/** Ventana de las métricas "recientes" (KPIs y duración de sesión). */
const WINDOW_DAYS = 30;
/** Cohortes consideradas para la retención: jugadores registrados en los últimos 180 días. */
const RETENTION_COHORT_DAYS = 180;
/** Pasos del embudo de activación: partidas completadas mínimas y días para volver. */
const FUNNEL_REGULAR_GAMES = 5;
const FUNNEL_RETURN_DAYS = 7;
/** Países que se muestran por separado; el resto se agrupa en "Otros". */
const TOP_COUNTRIES = 8;

/** AdminAnalyticsScreen (Contrato de API §9.3). Facade sobre las estadísticas de Users y Games. */
@Injectable()
export class AdminAnalyticsService {
  constructor(
    private readonly usersStats: UsersStatsReader,
    private readonly gamesStats: GamesStatsReader,
    private readonly gamesByPlayer: GamesByPlayerReader,
    private readonly breakdown: PlayersBreakdownReader,
    private readonly clock: AppClock,
  ) {}

  /**
   * GET /admin/analytics/kpis — RF-138, sobre los últimos 30 días:
   * sesión media (minutos), retención día 7 (%) y DAU/MAU (promedio diario / usuarios del período, %).
   */
  async kpis() {
    const today = this.clock.today();
    const from = addDays(today, -(WINDOW_DAYS - 1));
    const [averageSessionMinutes, retentionD7, daily, monthly] = await Promise.all([
      this.usersStats.averageSessionMinutes(from, today),
      this.usersStats.retention(7, addDays(today, -RETENTION_COHORT_DAYS), today),
      this.usersStats.dailyActiveUsers(from, today),
      this.usersStats.distinctActiveUsers(from, today),
    ]);
    const averageDaily = daily.reduce((sum, d) => sum + d.users, 0) / daily.length;
    return {
      averageSessionMinutes,
      retentionD7,
      dauMau: monthly ? Math.round((averageDaily / monthly) * 1000) / 10 : null,
    };
  }

  /** GET /admin/analytics/growth — RF-139. Últimos 6 meses. */
  growth() {
    return this.usersStats.monthlyGrowth(6);
  }

  /** GET /admin/analytics/retention — RF-140. rate es null si todavía nadie cumple esos días. */
  async retention() {
    const today = this.clock.today();
    const cohortFrom = addDays(today, -RETENTION_COHORT_DAYS);
    return Promise.all(RETENTION_DAYS.map(async (day) => ({ day, rate: await this.usersStats.retention(day, cohortFrom, today) })));
  }

  /** Rango de los últimos `days` días; sin `days`, de todos los tiempos. */
  private optionalRange(days?: number): [string?, string?] {
    if (!days) return [];
    const { from, to } = periodRange(this.clock.today(), days);
    return [from, to];
  }

  /** GET /admin/analytics/categories — RF-142. Partidas por categoría, en el período (RF-166) o de todos los tiempos. */
  async categories(days?: number) {
    return (await this.gamesStats.byCategory(...this.optionalRange(days))).map(({ category, games }) => ({ category, games }));
  }

  /** GET /admin/analytics/session-duration — RF-143. Últimos `days` días (30 por defecto), con el rango más común. */
  async sessionDuration(days: number = WINDOW_DAYS) {
    const { from, to } = periodRange(this.clock.today(), days);
    const buckets = await this.usersStats.sessionDurationDistribution(from, to);
    const top = buckets.reduce((best, b) => (b.pct > best.pct ? b : best), buckets[0]);
    return { buckets, mostCommon: top.pct > 0 ? top.range : null };
  }

  /** GET /admin/analytics/accuracy-radar — RF-144. Precisión promedio por categoría, en el período o de todos los tiempos. */
  async accuracyRadar(days?: number) {
    return (await this.gamesStats.byCategory(...this.optionalRange(days))).map(({ category, accuracy }) => ({ category, accuracy }));
  }

  /** GET /admin/analytics/signups — RF-167. Jugadores nuevos cada día del período. */
  signups(days: number) {
    const { from, to } = periodRange(this.clock.today(), days);
    return this.usersStats.signupsByDay(from, to);
  }

  /**
   * GET /admin/analytics/funnel — RF-168. De los jugadores registrados en el período: cuántos
   * completaron 1 partida, cuántos 5 o más y cuántos volvieron otro día en su primera semana.
   */
  async funnel(days: number) {
    const { from, to } = periodRange(this.clock.today(), days);
    const ids = await this.usersStats.playerIdsRegistered(from, to);
    const [games, returned] = await Promise.all([this.gamesByPlayer.completedGamesByPlayer(ids), this.usersStats.countReturnedWithin(ids, FUNNEL_RETURN_DAYS)]);
    return [
      { step: 'registered', players: ids.length },
      { step: 'firstGame', players: games.filter((g) => g.games >= 1).length },
      { step: 'regular', players: games.filter((g) => g.games >= FUNNEL_REGULAR_GAMES).length },
      { step: 'returned', players: returned },
    ];
  }

  /** GET /admin/analytics/countries — RF-169. Los 8 países con más jugadores; el resto en "other" y sin país en null. */
  async countries() {
    const rows = await this.breakdown.playersByCountry();
    const known = rows.filter((r) => r.country !== null);
    const other = known.slice(TOP_COUNTRIES).reduce((sum, r) => sum + r.players, 0);
    const unknown = rows.find((r) => r.country === null)?.players ?? 0;
    return [
      ...known.slice(0, TOP_COUNTRIES).map((r) => ({ country: r.country as string, players: r.players })),
      ...(other ? [{ country: 'other', players: other }] : []),
      ...(unknown ? [{ country: 'unknown', players: unknown }] : []),
    ];
  }

  /** GET /admin/analytics/signup-methods — RF-170. Jugadores registrados con correo, con Google o con los dos. */
  signupMethods() {
    return this.breakdown.playersBySignupMethod();
  }

  /** GET /admin/analytics/levels — RF-171. Jugadores por grupo de nivel. */
  levels() {
    return this.breakdown.playersByLevel();
  }

  /** GET /admin/analytics/heatmap — RF-172. Sesiones por día de la semana (0 = lunes) y hora, en el período. */
  heatmap(days: number) {
    const { from, to } = periodRange(this.clock.today(), days);
    return this.usersStats.activityHeatmap(from, to);
  }
}
