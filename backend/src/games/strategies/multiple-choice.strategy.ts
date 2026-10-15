import { Question } from '../entities/question.entity';
import { GameStrategy, PlayStyle } from './game-strategy';
import { normalizeAnswer } from './normalize-answer';

/**
 * Pregunta de opción múltiple: es correcta si coincide con la respuesta guardada, sin importar
 * mayúsculas, tildes ni espacios. Varios minijuegos usan esta regla con un estilo visual propio
 * (pistas, silueta, escudo, estadio, trayectoria, alineación).
 */
export class MultipleChoiceStrategy extends GameStrategy {
  constructor(readonly playStyle: PlayStyle = 'multiple-choice') {
    super();
  }

  isCorrect(question: Question, answer: string): boolean {
    return normalizeAnswer(answer) === normalizeAnswer(question.correctAnswer);
  }
}
