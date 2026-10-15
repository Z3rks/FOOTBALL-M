/**
 * Variación porcentual de `previous` a `current`, con un decimal. null si no hay base de
 * comparación (el período anterior fue 0): el frontend muestra "—" en lugar de un "+∞%".
 */
export function percentChange(previous: number, current: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Diferencia en puntos entre dos porcentajes (ej. precisión 73% → 71% = -2). null si falta alguno. */
export function pointsChange(previous: number | null, current: number | null): number | null {
  if (previous === null || current === null) return null;
  return Math.round((current - previous) * 10) / 10;
}
