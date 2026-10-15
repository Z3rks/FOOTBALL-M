import { Locale } from '../shared/i18n/locale';

/** Quién hace la acción (para la auditoría, RNF-SEC-04) y en qué idioma (para los CSV). */
export interface AdminContext {
  adminId: string;
  ip: string;
  locale: Locale;
}
