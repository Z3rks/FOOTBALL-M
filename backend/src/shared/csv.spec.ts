import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('escapa comas, comillas y saltos de línea', () => {
    expect(csvCell('hola, mundo')).toBe('"hola, mundo"');
    expect(csvCell('dijo "gol"')).toBe('"dijo ""gol"""');
    expect(csvCell('dos\nlíneas')).toBe('"dos\nlíneas"');
  });

  it.each(['=HYPERLINK("http://malo")', '+1+1', '-2+3', '@SUM(A1)', '\tTAB'])('neutraliza la fórmula %s', (value) => {
    expect(csvCell(value).replace(/^"/, '')).toMatch(/^'/);
  });

  it('no altera números negativos ni vacíos', () => {
    expect(csvCell(-300)).toBe('-300');
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });

  it('arma el archivo con BOM y \\r\\n', () => {
    expect(toCsv([['a', 1], ['ñandú', 2]])).toBe('﻿a,1\r\nñandú,2\r\n');
  });
});
