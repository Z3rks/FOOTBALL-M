import { Question } from '../entities/question.entity';
import { GameStrategy } from './game-strategy';
import { normalizeAnswer } from './normalize-answer';

/** Un evento de la línea de tiempo y su año: ["Maracanazo", 1950]. */
export type TimelineEntry = [event: string, year: number];

/**
 * Respuesta correcta de una pregunta de Timeline: los eventos en orden cronológico con su año,
 * en JSON compacto (cabe en QUESTION.correct_answer). El año solo se muestra al jugador
 * después de responder.
 */
export function parseTimeline(value: string): TimelineEntry[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const entries = parsed.map((item) => (Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'number' ? (item as TimelineEntry) : null));
    return entries.every((e): e is TimelineEntry => e !== null) ? entries : null;
  } catch {
    return null;
  }
}

/** Orden que envió el jugador: JSON con la lista de eventos (o de pares [evento, año]). */
function parseOrder(answer: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(answer);
    if (!Array.isArray(parsed)) return null;
    const events = parsed.map((item) => (typeof item === 'string' ? item : Array.isArray(item) && typeof item[0] === 'string' ? item[0] : null));
    return events.every((e): e is string => e !== null) ? events : null;
  } catch {
    return null;
  }
}

/**
 * Timeline (patrón Strategy): ordenar eventos del más antiguo al más reciente. Es correcta solo
 * si el orden completo coincide. Una respuesta mal formada cuenta como incorrecta, nunca como error.
 */
export class TimelineStrategy extends GameStrategy {
  readonly playStyle = 'timeline' as const;

  isCorrect(question: Question, answer: string): boolean {
    const expected = parseTimeline(question.correctAnswer);
    const given = parseOrder(answer);
    if (!expected || !given || given.length !== expected.length) return false;
    return expected.every(([event], i) => normalizeAnswer(event) === normalizeAnswer(given[i]));
  }
}
