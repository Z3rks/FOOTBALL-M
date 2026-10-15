import { Injectable } from '@nestjs/common';
import { GamesStatsReader } from '../../games/games-stats.reader';
import { Locale } from '../../shared/i18n/locale';
import { addDays } from '../../shared/time/app-date';
import { UsersStatsReader } from '../../users/users-stats.reader';
import { percentChange, pointsChange } from '../metrics';
import { AppClock } from '../../shared/time/app-clock';

/** Caída de la retención día 7 (en puntos) que dispara una alerta. */
const RETENTION_DROP_ALERT_POINTS = 3;

/**
 * Alerta del sistema. `code` y `values` permiten mostrarla en el idioma del administrador (el
 * frontend la traduce, igual que los errores); `message` es el texto en inglés.
 */
export interface SystemAlert {
  type: 'warn' | 'info';
  code: 'retentionDrop' | 'dailyRecord';
  values: Record<string, number>;
  message: string;
}

/** AdminDashboardScreen (Contrato de API §9.1). Facade sobre las estadísticas de Users y Games. */
@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly usersStats: UsersStatsReader,
    private readonly clock: AppClock,
    private readonly gamesStats: GamesStatsReader,
  ) {}

  /**
   * GET /admin/dashboard/summary — RF-121 a RF-123. Cada KPI trae su variación:
   * usuarios totales frente a hace 7 días; activos, partidas y precisión de hoy frente a ayer
   * (la precisión en puntos, no en porcentaje).
   */
  async summary() {
    const today = this.clock.today();
    const yesterday = addDays(today, -1);
    const [totalUsers, usersWeekAgo, activeToday, activeYesterday, gamesToday, gamesYesterday] = await Promise.all([
      this.usersStats.countPlayersUntil(today),
      this.usersStats.countPlayersUntil(addDays(today, -7)),
      this.usersStats.distinctActiveUsers(today, today),
      this.usersStats.distinctActiveUsers(yesterday, yesterday),
      this.gamesStats.totals(today, today),
      this.gamesStats.totals(yesterday, yesterday),
    ]);

    return {
      generatedAt: new Date(),
      status: 'online' as const,
      alerts: await this.alerts(today, gamesToday.games),
      kpis: {
        totalUsers: { value: totalUsers, change: percentChange(usersWeekAgo, totalUsers) },
        activeToday: { value: activeToday, change: percentChange(activeYesterday, activeToday) },
        gamesToday: { value: gamesToday.games, change: percentChange(gamesYesterday.games, gamesToday.games) },
        averageAccuracy: { value: gamesToday.accuracy, change: pointsChange(gamesYesterday.accuracy, gamesToday.accuracy) },
      },
    };
  }

  /** GET /admin/dashboard/dau — RF-125. Últimos 7 días y variación contra los 7 anteriores. */
  async dailyActiveUsers() {
    const today = this.clock.today();
    const days = await this.usersStats.dailyActiveUsers(addDays(today, -13), today);
    const previous = days.slice(0, 7).reduce((sum, d) => sum + d.users, 0);
    const current = days.slice(7);
    return { days: current, weeklyChange: percentChange(previous, current.reduce((sum, d) => sum + d.users, 0)) };
  }

  /** GET /admin/dashboard/ranking — RF-126. Los 4 minijuegos más jugados, con el nombre en el idioma pedido. */
  ranking(locale: Locale) {
    return this.gamesStats.ranking(4, this.clock.today(), locale);
  }

  /** Alertas del sistema (RF-122), calculadas con reglas sobre los datos reales. */
  private async alerts(today: string, gamesToday: number): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    // Retención día 7 de los registrados la semana pasada vs. la semana anterior.
    const [recent, older] = await Promise.all([
      this.usersStats.retention(7, addDays(today, -13), addDays(today, -7)),
      this.usersStats.retention(7, addDays(today, -20), addDays(today, -14)),
    ]);
    const drop = pointsChange(older, recent);
    if (drop !== null && drop <= -RETENTION_DROP_ALERT_POINTS) {
      const points = Math.abs(drop);
      alerts.push({ type: 'warn', code: 'retentionDrop', values: { points }, message: `Day-7 retention dropped ${points} points vs last week` });
    }

    const record = await this.gamesStats.maxDailyGamesBefore(today);
    if (gamesToday > 0 && gamesToday > record) {
      alerts.push({ type: 'info', code: 'dailyRecord', values: { games: gamesToday }, message: `${gamesToday} games completed today — new daily record` });
    }
    return alerts;
  }

  /**
   * GET /admin/dashboard/trends — RF-173. Serie de los últimos 7 días de cada KPI, para las mini
   * gráficas de tendencia: jugadores totales, activos, partidas y precisión de cada día.
   */
  async trends() {
    const today = this.clock.today();
    const from = addDays(today, -6);
    const [signups, before, active, games] = await Promise.all([
      this.usersStats.signupsByDay(from, today),
      this.usersStats.countPlayersUntil(addDays(from, -1)),
      this.usersStats.dailyActiveUsers(from, today),
      this.gamesStats.dailyGamesAndXp(from, today),
    ]);
    let total = before;
    return signups.map(({ date, users }, i) => {
      total += users;
      return { date, totalUsers: total, activeUsers: active[i]?.users ?? 0, games: games[i]?.games ?? 0, accuracy: games[i]?.accuracy ?? null };
    });
  }
}
