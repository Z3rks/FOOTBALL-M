import { Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/decorators';
import { parseLocale } from '../shared/i18n/locale';
import { AdminContext } from './admin-context';
import { CsvFile } from './reports/report-export';

/** Quién hace la acción, desde qué IP y en qué idioma (auditoría y CSV). */
export const adminContext = (user: AuthenticatedUser, req: Request): AdminContext => ({
  adminId: user.id,
  ip: req.ip ?? 'unknown',
  locale: parseLocale(req.headers['accept-language']),
});

/** Responde un CSV como descarga, con su nombre de archivo. */
export function sendCsv(res: Response, { filename, csv }: CsvFile): string {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return csv;
}
