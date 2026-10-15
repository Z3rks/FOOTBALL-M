export type CsvCell = string | number | boolean | Date | null | undefined;

/**
 * Una celda CSV segura. Plan de Seguridad A03: si un texto empieza con = + - @ (o tab/retorno),
 * Excel lo ejecutaría como fórmula al abrir el reporte ("CSV injection"); se antepone ' para
 * que quede como texto. Los números no se tocan.
 */
export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV con BOM UTF-8 (para que Excel muestre bien tildes y ñ) y saltos de línea \r\n. */
export function toCsv(rows: CsvCell[][]): string {
  return '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
