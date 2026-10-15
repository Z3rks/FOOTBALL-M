import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { toCsv } from '../../shared/csv';
import { AdminActionEvent, DomainEvents } from '../../shared/events/domain-events';
import { PlayerDirectory, PlayerFilter } from '../../users/player-directory';
import { AdminContext } from '../admin-context';
import { AdminReportsService } from './admin-reports.service';
import { CSV_LABELS } from './csv-labels';
import { CsvFile, IReportExport } from './report-export';

/** Tope de filas del CSV de usuarios (evita respuestas gigantes). */
export const USERS_EXPORT_LIMIT = 10_000;

/** Exportaciones del panel administrativo en CSV (RF-132, RF-152/RF-153), en el idioma del administrador. */
@Injectable()
export class CsvReportExportService implements IReportExport {
  constructor(
    private readonly players: PlayerDirectory,
    private readonly reports: AdminReportsService,
    private readonly events: EventEmitter2,
  ) {}

  /** GET /admin/users/export — CSV con los mismos filtros de la lista. */
  async exportUsers(ctx: AdminContext, filter: PlayerFilter, search: string | undefined): Promise<CsvFile> {
    const labels = CSV_LABELS[ctx.locale];
    const { rows } = await this.players.searchPlayers(filter, search, 1, USERS_EXPORT_LIMIT);
    const csv = toCsv([
      labels.usersHeader,
      ...rows.map((p) => [p.username, p.email, p.country, p.status, p.level, p.streakDays, p.xpTotal, p.accuracy, p.createdAt]),
    ]);
    await this.audit(ctx, 'Export users', `filter=${filter}; search=${search ?? ''}; rows=${rows.length}`);
    return { filename: labels.usersFile, csv };
  }

  /** GET /admin/reports/export — reporte completo del mes. */
  async exportMonthlyReport(ctx: AdminContext, month?: string): Promise<CsvFile> {
    const labels = CSV_LABELS[ctx.locale];
    const range = this.reports.resolveMonth(month);
    const [summary, top, categories, peak] = await Promise.all([
      this.reports.summary(range.month),
      this.reports.topPlayers(range.month),
      this.reports.categoryPerformance(range.month),
      this.reports.peakHours(range.month),
    ]);
    const csv = toCsv([
      [labels.reportTitle, range.month],
      [],
      [labels.keyMetrics],
      [labels.totalGames, summary.keyMetrics.totalGames],
      [labels.averageSessionMinutes, summary.keyMetrics.averageSessionMinutes],
      [labels.questionsAnswered, summary.keyMetrics.questionsAnswered],
      [labels.averageDailyXp, summary.keyMetrics.averageDailyXpPerActiveUser],
      [],
      labels.weeksHeader,
      ...summary.weeks.map((w) => [labels.weekLabel(w.week), w.from, w.to, w.users, w.games, w.xp]),
      [],
      labels.topPlayersHeader,
      ...top.map((p) => [p.rank, p.username, p.country, p.xp, p.accuracy]),
      [],
      labels.categoriesHeader,
      ...categories.map((c) => [labels.category(c.category), c.games, c.accuracy, c.trend]),
      [],
      labels.hoursHeader,
      ...peak.hours.map((h) => [h.hour, h.sessions]),
    ]);
    await this.audit(ctx, 'Export report', `month=${range.month}`);
    return { filename: labels.reportFile(range.month), csv };
  }

  /** Si no se puede auditar, la exportación falla (el listener no suprime errores). */
  private async audit(ctx: AdminContext, action: string, details: string): Promise<void> {
    await this.events.emitAsync(DomainEvents.ADMIN_ACTION, new AdminActionEvent(ctx.adminId, action, ctx.ip, null, details));
  }
}
