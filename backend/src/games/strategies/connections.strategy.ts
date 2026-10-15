import { Question } from '../entities/question.entity';
import { GameStrategy } from './game-strategy';
import { normalizeAnswer } from './normalize-answer';

/** Un grupo del tablero: [lo que tienen en común, sus 4 jugadores]. */
export type ConnectionsGroup = [label: string, members: string[]];

/** Respuesta correcta de un tablero de Connections: los grupos, en JSON compacto. */
export function parseGroups(value: string): ConnectionsGroup[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const ok = parsed.every((g) => Array.isArray(g) && typeof g[0] === 'string' && Array.isArray(g[1]) && g[1].every((m: unknown) => typeof m === 'string'));
    return ok ? (parsed as ConnectionsGroup[]) : null;
  } catch {
    return null;
  }
}

/** Jugadores que eligió el jugador: JSON con la lista (o los grupos completos, tomando el primero). */
function parseSelection(answer: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(answer);
    if (!Array.isArray(parsed)) return null;
    if (parsed.every((m) => typeof m === 'string')) return parsed as string[];
    return parseGroups(answer)?.[0]?.[1] ?? null;
  } catch {
    return null;
  }
}

const sameMembers = (a: string[], b: string[]) => {
  const set = new Set(a.map(normalizeAnswer));
  return a.length === b.length && set.size === b.length && b.every((m) => set.has(normalizeAnswer(m)));
};

/**
 * Connections: en un tablero de 8 jugadores hay 2 grupos de 4 con algo en común. Es correcta si
 * los 4 elegidos forman uno de los grupos (cualquiera).
 */
export class ConnectionsStrategy extends GameStrategy {
  readonly playStyle = 'connections' as const;

  isCorrect(question: Question, answer: string): boolean {
    const groups = parseGroups(question.correctAnswer);
    const selection = parseSelection(answer);
    if (!groups || !selection) return false;
    return groups.some(([, members]) => sameMembers(selection, members));
  }
}
