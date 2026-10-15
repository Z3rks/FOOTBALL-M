/** Porcentaje de aciertos con un decimal; null si no hubo preguntas. */
export const accuracyOf = (correct: number, questions: number): number | null => (questions ? Math.round((correct / questions) * 1000) / 10 : null);
