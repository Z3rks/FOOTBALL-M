import { BadRequestException, Injectable } from '@nestjs/common';
import { GamesStatsReader } from '../../games/games-stats.reader';
import { addDays, isoWeek, mondayOf, monthBounds, previousMonth } from '../../shared/time/app-date';
import { PlayerDirectory } from '../../users/player-directory';
import { UsersStatsReader } from '../../users/users-stats.reader';
import { AppClock } from '../../shared/time/app-clock';

export interface MonthRange {
  month: string;
  from: string;
  /** Último día con datos: el fin de mes, o hoy si es el mes en curso. */
  to: string;
}

/**
 * AdminReportsScreen (Contrato de API §9.4). Patrón Facade (Arquitectura §6): reúne en un
 * reporte mensual datos de Users (actividad) y Games (partidas, XP, categorías).
 */
@Injectable()
export class AdminReportsService {
  constructor(
    private readonly usersStats: UsersStatsReader,
    private readonly clock: AppClock,
    private readonly gamesStats: GamesStatsReader,
    private readonly players: PlayerDirectory,
  ) {}

  /** Mes YYYY-MM (por defecto el actual). No se aceptan meses futuros ("Cambiar mes", RF-149). */
  resolveMonth(month?: string): MonthRange {
    const today = this.clock.today();
    const current = today.slice(0, 7);
    const selected = month ?? current;
    if (selected > current) throw new BadRequestException('month cannot be in the future');
    const { from, to } = monthBounds(selected);
    return { month: selected, from, to: to < today ? to : today };
  }

  /**
   * GET /admin/reports/summary — RF-146 a RF-148: métricas clave y resumen de las últimas
   * 4 semanas (ISO, de lunes a domingo) hasta el final del mes elegido.
   */
  async summary(month?: string) {
    const range = this.resolveMonth(month);
    const [allTime, monthTotals, averageSessionMinutes, questionsAnswered, dailyActive] = await Promise.all([
      this.gamesStats.totals(),
      this.gamesStats.totals(range.from, range.to),
      this.usersStats.averageSessionMinutes(range.from, range.to),
      this.gamesStats.answersCount(),
      this.usersStats.dailyActiveUsers(range.from, range.to),
    ]);
    const activeUserDays = dailyActive.reduce((sum, d) => sum + d.users, 0);
    return {
      month: range.month,
      keyMetrics: {
        totalGames: allTime.games,
        averageSessionMinutes,
        questionsAnswered,
        averageDailyXpPerActiveUser: activeUserDays ? Math.round(monthTotals.xp / activeUserDays) : 0,
      },
      weeks: await this.lastFourWeeks(range.to),
    };
  }

  /** GET /admin/reports/top-players — RF-150. Los 5 con más XP ganada en el mes. */
  async topPlayers(month?: string) {
    const range = this.resolveMonth(month);
    const top = await this.gamesStats.topPlayersByXp(range.from, range.to, 5);
    const players = new Map((await this.players.findPlayersByIds(top.map((t) => t.userId))).map((u) => [u.id, u]));
    return top.map((t, i) => ({
      rank: i + 1,
      userId: t.userId,
      username: players.get(t.userId)?.username ?? null,
      country: players.get(t.userId)?.country ?? null,
      xp: t.xp,
      accuracy: t.accuracy,
    }));
  }

  /** GET /admin/reports/category-performance — RF-151. Tendencia: partidas vs. el mes anterior. */
  async categoryPerformance(month?: string) {
    const range = this.resolveMonth(month);
    const previous = monthBounds(previousMonth(range.month));
    const [current, before] = await Promise.all([this.gamesStats.byCategory(range.from, range.to), this.gamesStats.byCategory(previous.from, previous.to)]);
    return current
      .map((c) => {
        const prev = before.find((b) => b.category === c.category)?.games ?? 0;
        return { ...c, trend: c.games > prev ? 'up' : c.games < prev ? 'down' : 'flat' };
      })
      .sort((a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1) || b.games - a.games);
  }

  /** GET /admin/reports/peak-hours — RF-152. Sesiones iniciadas por hora (0-23) en el mes. */
  async peakHours(month?: string) {
    const range = this.resolveMonth(month);
    const counts = await this.usersStats.sessionsByHour(range.from, range.to);
    const max = Math.max(...counts);
    return { hours: counts.map((sessions, hour) => ({ hour, sessions })), peakHour: max > 0 ? counts.indexOf(max) : null };
  }

  /** Las 4 semanas ISO que terminan en la semana de `end`, de la más antigua a la más reciente. */
  private async lastFourWeeks(end: string) {
    const lastMonday = mondayOf(end);
    const firstMonday = addDays(lastMonday, -21);
    const daily = await this.gamesStats.dailyGamesAndXp(firstMonday, end);
    return Promise.all(
      [0, 1, 2, 3].map(async (i) => {
        const from = addDays(firstMonday, i * 7);
        const sunday = addDays(from, 6);
        const to = sunday < end ? sunday : end;
        const days = daily.filter((d) => d.date >= from && d.date <= to);
        return {
          /** Etiqueta en inglés; el frontend y el CSV la arman en el idioma del administrador con `week`. */
          label: `Wk ${isoWeek(from)}`,
          /** Número de semana ISO. */
          week: isoWeek(from),
          from,
          to,
          users: await this.usersStats.distinctActiveUsers(from, to),
          games: days.reduce((sum, d) => sum + d.games, 0),
          xp: days.reduce((sum, d) => sum + d.xp, 0),
          current: i === 3,
        };
      }),
    );
  }
}
