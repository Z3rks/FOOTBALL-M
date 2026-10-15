import { Question } from '../entities/question.entity';
import { GameStrategy } from './game-strategy';
import { normalizeAnswer } from './normalize-answer';

/** Decisión del VAR y su explicación: {"a":"No gol","w":"…"}. La explicación se ve al responder. */
export interface VarVerdict {
  a: string;
  w: string;
}

export function parseVerdict(value: string): VarVerdict | null {
  try {
    const parsed = JSON.parse(value) as Partial<VarVerdict>;
    return typeof parsed?.a === 'string' && typeof parsed.w === 'string' ? { a: parsed.a, w: parsed.w } : null;
  } catch {
    return null;
  }
}

/**
 * Goal or No Goal? (estilo VAR): se decide si la jugada es válida. Es correcta si coincide con
 * la decisión reglamentaria; la respuesta revelada incluye la explicación de la regla.
 */
export class VarStrategy extends GameStrategy {
  readonly playStyle = 'var' as const;

  isCorrect(question: Question, answer: string): boolean {
    const verdict = parseVerdict(question.correctAnswer);
    if (!verdict) return false;
    const given = parseVerdict(answer)?.a ?? answer;
    return normalizeAnswer(given) === normalizeAnswer(verdict.a);
  }
}
