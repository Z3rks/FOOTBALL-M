/**
 * Fecha calendario (YYYY-MM-DD) en la zona horaria de la app. El reto diario y la racha
 * cambian a la medianoche de esa zona, no a la medianoche UTC.
 */
export function dateInTimeZone(timeZone: string, at: Date = new Date()): string {
  // en-CA da el formato YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}

/** Número de días desde 1970-01-01 para una fecha YYYY-MM-DD (sirve para rotar el reto diario). */
export function dayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

/** Suma (o resta) días a una fecha YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Primer y último día de un mes YYYY-MM. */
export function monthBounds(month: string): { from: string; to: string } {
  const [year, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

/** Mes anterior de uno YYYY-MM. */
export function previousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, '0')}`;
}

/** Número de semana ISO 8601 de una fecha YYYY-MM-DD (la semana empieza el lunes). */
export function isoWeek(date: string): number {
  const d = new Date(`${date}T00:00:00Z`);
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - weekday); // jueves de la misma semana
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

/** Lunes de la semana ISO de una fecha YYYY-MM-DD. */
export function mondayOf(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
  return addDays(date, 1 - weekday);
}
