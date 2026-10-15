import { Question } from '../entities/question.entity';
import { GameStrategy } from './game-strategy';

/** Margen de acierto: ±10 % del valor real, y nunca menos de 5 millones. */
export const VALUE_TOLERANCE = 0.1;
export const VALUE_MIN_MARGIN = 5;

/** Cifra en millones: "222", "222.5", "€222 millones" → 222. */
function toMillions(value: string): number | null {
  const match = /-?\d+(?:[.,]\d+)?/.exec(value);
  return match ? Number(match[0].replace(',', '.')) : null;
}

/**
 * How much was he worth?: se adivina el valor de un traspaso (en millones de euros) con un
 * deslizador. Es correcta si queda cerca del valor real.
 */
export class ValueGuessStrategy extends GameStrategy {
  readonly playStyle = 'value' as const;

  isCorrect(question: Question, answer: string): boolean {
    const actual = toMillions(question.correctAnswer);
    const guess = toMillions(answer);
    if (actual === null || guess === null) return false;
    return Math.abs(guess - actual) <= Math.max(VALUE_MIN_MARGIN, actual * VALUE_TOLERANCE);
  }
}
