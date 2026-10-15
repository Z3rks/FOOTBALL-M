/**
 * Minúsculas, sin tildes y sin espacios repetidos: "  Atlético de MADRID " → "atletico de madrid".
 * Utilidad compartida por las estrategias para comparar respuestas escritas de distinta forma;
 * vive aparte para que ninguna estrategia dependa de otra.
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
