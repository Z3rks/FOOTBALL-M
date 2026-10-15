import { displayedStreak, levelForXp, nextStreak, reachedStreakReward, xpToNextLevel } from './progress';

describe('niveles', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [1245, 13],
  ])('con %i XP el nivel es %i', (xp, level) => expect(levelForXp(xp)).toBe(level));

  it('calcula la XP que falta para subir', () => {
    expect(xpToNextLevel(0)).toBe(100);
    expect(xpToNextLevel(1245)).toBe(55);
  });
});

describe('racha', () => {
  it('empieza en 1 con la primera partida', () => expect(nextStreak(0, null, '2026-09-24')).toBe(1));
  it('no cambia si ya jugó hoy', () => expect(nextStreak(5, '2026-09-24', '2026-09-24')).toBe(5));
  it('sube si jugó ayer', () => expect(nextStreak(5, '2026-09-23', '2026-09-24')).toBe(6));
  it('vuelve a 1 si dejó pasar un día', () => expect(nextStreak(5, '2026-09-22', '2026-09-24')).toBe(1));
  it('cruza el cambio de mes', () => expect(nextStreak(3, '2026-09-30', '2026-10-01')).toBe(4));

  it('se muestra en 0 si ya está rota, aunque no se haya jugado desde entonces', () => {
    expect(displayedStreak(5, '2026-09-23', '2026-09-24')).toBe(5);
    expect(displayedStreak(5, '2026-09-22', '2026-09-24')).toBe(0);
    expect(displayedStreak(0, null, '2026-09-24')).toBe(0);
  });

  it('premia al llegar a 7, 14, 21… días, solo el día que se alcanza', () => {
    expect(reachedStreakReward(6, 7)).toBe(true);
    expect(reachedStreakReward(13, 14)).toBe(true);
    expect(reachedStreakReward(7, 7)).toBe(false);
    expect(reachedStreakReward(7, 8)).toBe(false);
  });
});
