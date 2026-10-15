import { PlayerFilter } from '../../users/player-directory';
import { AdminContext } from '../admin-context';

export interface CsvFile {
  filename: string;
  csv: string;
}

/**
 * Exportaciones a CSV del panel administrativo (Arquitectura §7, segregación de interfaces).
 * Cada exportación queda auditada.
 */
export abstract class IReportExport {
  /** Jugadores con los mismos filtros de AdminUsersScreen (RF-132). */
  abstract exportUsers(ctx: AdminContext, filter: PlayerFilter, search: string | undefined): Promise<CsvFile>;
  /** Reporte completo de un mes YYYY-MM, por defecto el actual (RF-152/RF-153). */
  abstract exportMonthlyReport(ctx: AdminContext, month?: string): Promise<CsvFile>;
}
