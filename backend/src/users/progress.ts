import { dayNumber } from '../shared/time/app-date';

/** XP necesaria para subir cada nivel. Nivel 1 con 0 XP, nivel 2 con 100, nivel 13 con 1.200… */
export const XP_PER_LEVEL = 100;
/** "Maintain 7-day streak" (CreditsScreen): se premia cada 7 días seguidos. */
export const STREAK_REWARD_EVERY = 7;

export function levelForXp(xpTotal: number): number {
  return Math.floor(Math.max(0, xpTotal) / XP_PER_LEVEL) + 1;
}

/** XP que falta para el siguiente nivel. */
export function xpToNextLevel(xpTotal: number): number {
  return levelForXp(xpTotal) * XP_PER_LEVEL - Math.max(0, xpTotal);
}

/**
 * Racha de días consecutivos jugando (RF-057). `lastPlayedOn` y `today` son fechas YYYY-MM-DD
 * en la zona horaria de la app.
 * - Ya jugó hoy: la racha no cambia.
 * - Jugó ayer: +1.
 * - Nunca jugó o dejó pasar un día: vuelve a 1.
 */
export function nextStreak(currentStreak: number, lastPlayedOn: string | null, today: string): number {
  if (!lastPlayedOn) return 1;
  const gap = dayNumber(today) - dayNumber(lastPlayedOn);
  if (gap <= 0) return Math.max(currentStreak, 1);
  if (gap === 1) return currentStreak + 1;
  return 1;
}

/** Racha que se muestra: si pasó más de un día sin jugar, ya está rota aunque no se haya guardado. */
export function displayedStreak(streakDays: number, lastPlayedOn: string | null, today: string): number {
  if (!lastPlayedOn) return 0;
  return dayNumber(today) - dayNumber(lastPlayedOn) <= 1 ? streakDays : 0;
}

/** ¿Esta partida hizo que la racha llegara a un múltiplo de 7? (premio de créditos). */
export function reachedStreakReward(previousStreak: number, newStreak: number): boolean {
  return newStreak > previousStreak && newStreak % STREAK_REWARD_EVERY === 0;
}
