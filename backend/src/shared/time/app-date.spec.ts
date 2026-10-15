import { addDays, dateInTimeZone, dayNumber, isoWeek, mondayOf, monthBounds, previousMonth } from './app-date';

describe('dateInTimeZone', () => {
  it('usa la fecha de Bogotá, no la de UTC', () => {
    // 2026-09-25 03:00 UTC es todavía 2026-09-24 a las 22:00 en Bogotá (UTC-5).
    const at = new Date('2026-09-25T03:00:00Z');
    expect(dateInTimeZone('America/Bogota', at)).toBe('2026-09-24');
    expect(dateInTimeZone('UTC', at)).toBe('2026-09-25');
  });
});

describe('dayNumber', () => {
  it('cuenta días consecutivos', () => {
    expect(dayNumber('2026-09-25') - dayNumber('2026-09-24')).toBe(1);
    expect(dayNumber('1970-01-01')).toBe(0);
  });
});

describe('aritmética de fechas', () => {
  it('addDays cruza meses y años', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('monthBounds conoce los días de cada mes (incluido febrero bisiesto)', () => {
    expect(monthBounds('2026-09')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(monthBounds('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('previousMonth cruza el año', () => {
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(previousMonth('2026-09')).toBe('2026-08');
  });

  it('isoWeek y mondayOf siguen ISO 8601', () => {
    expect(isoWeek('2026-09-24')).toBe(39);
    expect(isoWeek('2027-01-01')).toBe(53); // pertenece a la última semana de 2026
    expect(mondayOf('2026-09-24')).toBe('2026-09-21');
    expect(mondayOf('2026-09-21')).toBe('2026-09-21');
  });
});
