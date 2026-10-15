/**
 * Constructores de preguntas de cada estilo de minijuego. Se usan igual para el contenido
 * original (games.data.ts) y para su traducción (games.en.data.ts).
 */

export interface QuestionSeed {
  statement: string;
  options: string[] | null;
  correctAnswer: string;
  /** Datos públicos del estilo del minijuego (nunca la respuesta). */
  details?: Record<string, unknown>;
}

/** Who is it?: pistas que se revelan una a una, de la más vaga a la más clara. */
export function clues(statement: string, hints: string[], options: string[], correctAnswer: string): QuestionSeed {
  return { statement, options, correctAnswer, details: { clues: hints } };
}

/** Silhouette: ficha borrosa del jugador (bandera, posición, época y un dato) que se va aclarando. */
export function silhouette(statement: string, card: { flag: string; position: string; era: string; fact: string }, options: string[], correctAnswer: string): QuestionSeed {
  return { statement, options, correctAnswer, details: card };
}

/** Guess the Badge: escudo dibujado con los colores del club (sin usar el escudo real). */
export function crest(statement: string, badge: { colors: string[]; initials: string; city: string; founded: number }, options: string[], correctAnswer: string): QuestionSeed {
  return { statement, options, correctAnswer, details: badge };
}

/** Guess the Stadium: ficha del estadio que se revela por partes. */
export function stadium(statement: string, info: { flag: string; city: string; capacity: number; opened: number }, options: string[], correctAnswer: string): QuestionSeed {
  return { statement, options, correctAnswer, details: info };
}

/** Connections: 2 grupos de 4; el tablero muestra los 8 jugadores mezclados. */
export function connections(statement: string, groups: Array<[string, string[]]>): QuestionSeed {
  const [a, b] = groups.map(([, members]) => members);
  const options = [a[0], b[1], a[2], b[0], a[1], b[3], a[3], b[2]];
  return { statement, options, correctAnswer: JSON.stringify(groups) };
}

/** The Transfer: trayectoria de clubes; el siguiente queda oculto. */
export function career(statement: string, info: { player: string; year: number; path: string[] }, options: string[], correctAnswer: string): QuestionSeed {
  return { statement, options, correctAnswer, details: info };
}

/** How much was he worth?: valor del traspaso en millones de euros, adivinado con un deslizador. */
export function value(statement: string, info: { player: string; from: string; to: string; year: number }, millions: number): QuestionSeed {
  return { statement, options: null, correctAnswer: String(millions), details: { ...info, max: 250, step: 1 } };
}

/** Dream Team: alineación por líneas (del portero al ataque) con un jugador oculto. */
export function lineup(statement: string, team: string, formation: string, rows: string[][], missing: string, options: string[]): QuestionSeed {
  const hidden = rows.map((row) => row.map((name) => (name === missing ? null : name)));
  return { statement, options, correctAnswer: missing, details: { team, formation, rows: hidden } };
}

/** Goal or No Goal?: decisión del VAR y la regla que la explica (se revela al responder). */
export function varCall(statement: string, play: string, options: string[], verdict: string, why: string): QuestionSeed {
  return { statement, options, correctAnswer: JSON.stringify({ a: verdict, w: why }), details: { play } };
}

/** Posiciones en que se muestran los eventos (desordenados), distintas entre preguntas. */
const SHUFFLES = [
  [2, 0, 3, 1],
  [3, 1, 0, 2],
  [1, 3, 2, 0],
  [0, 2, 1, 3],
];

/**
 * Pregunta de Timeline: los eventos van en orden cronológico con su año. Las opciones se muestran
 * desordenadas y la respuesta correcta se guarda en JSON compacto (TimelineStrategy). El orden en
 * que se muestran depende de los años, así la pregunta y su traducción coinciden.
 */
export function timeline(statement: string, events: Array<[string, number]>): QuestionSeed {
  const order = SHUFFLES[events.reduce((sum, [, year]) => sum + year, 0) % SHUFFLES.length];
  return { statement, options: order.map((i) => events[i][0]), correctAnswer: JSON.stringify(events) };
}
