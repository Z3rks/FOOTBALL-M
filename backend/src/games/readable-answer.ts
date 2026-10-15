/**
 * Respuesta correcta en texto legible para el administrador. Las de formato JSON se resumen:
 * la decisión del VAR y los nombres de los grupos de Connections; el orden de Timeline no
 * (devuelve null).
 */
export function readableAnswer(correctAnswer: string): string | null {
  if (!/^[[{]/.test(correctAnswer.trim())) return correctAnswer;
  try {
    const parsed: unknown = JSON.parse(correctAnswer);
    if (isVarVerdict(parsed)) return parsed.a;
    if (isConnectionsGroups(parsed)) return parsed.map(([label]) => label).join(' / ');
    return null;
  } catch {
    return null;
  }
}

/** {"a": "No goal", "w": "..."}: la decisión del VAR (VarStrategy). */
function isVarVerdict(value: unknown): value is { a: string } {
  return !!value && typeof value === 'object' && !Array.isArray(value) && typeof (value as { a?: unknown }).a === 'string';
}

/** [["Grupo", ["A", "B", "C", "D"]], ...]: los grupos de Connections (ConnectionsStrategy). */
function isConnectionsGroups(value: unknown): value is Array<[string, string[]]> {
  return Array.isArray(value) && value.every((group) => Array.isArray(group) && Array.isArray(group[1]));
}
