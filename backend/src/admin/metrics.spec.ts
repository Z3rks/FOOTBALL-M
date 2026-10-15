import { percentChange, pointsChange } from './metrics';

describe('percentChange', () => {
  it.each([
    [100, 108, 8],
    [1203, 1000, -16.9],
    [50, 50, 0],
    [0, 0, 0],
  ])('de %i a %i = %d%', (previous, current, expected) => expect(percentChange(previous, current)).toBe(expected));

  it('sin base de comparación (antes 0, ahora > 0) devuelve null en lugar de infinito', () => {
    expect(percentChange(0, 5)).toBeNull();
  });
});

describe('pointsChange', () => {
  it('resta porcentajes en puntos', () => {
    expect(pointsChange(73, 71)).toBe(-2);
    expect(pointsChange(70.25, 72.5)).toBe(2.3);
  });

  it('devuelve null si falta alguno de los dos valores', () => {
    expect(pointsChange(null, 70)).toBeNull();
    expect(pointsChange(70, null)).toBeNull();
  });
});
