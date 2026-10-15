import { Question } from '../entities/question.entity';
import { GameDifficulty } from '../enums';

/** Estilos de juego que el frontend sabe dibujar (uno por minijuego, más el genérico). */
export type PlayStyle =
  | 'multiple-choice'
  | 'clues'
  | 'silhouette'
  | 'crest'
  | 'stadium'
  | 'connections'
  | 'timeline'
  | 'career'
  | 'value'
  | 'lineup'
  | 'var';

/** XP por respuesta correcta antes del multiplicador de dificultad. */
export const XP_PER_CORRECT = 10;

const DIFFICULTY_MULTIPLIER: Record<GameDifficulty, number> = {
  [GameDifficulty.EASY]: 1,
  [GameDifficulty.MEDIUM]: 1.25,
  [GameDifficulty.HARD]: 1.5,
  [GameDifficulty.EXPERT]: 2,
};

/**
 * IGameStrategy (Arquitectura §6, patrón Strategy): las reglas de un minijuego.
 * Para un minijuego con reglas distintas se crea una subclase y se registra en GameFactory;
 * ninguna otra clase cambia (principio Open/Closed). Toda subclase debe respetar el mismo
 * contrato de entrada y salida (principio de sustitución de Liskov).
 */
export abstract class GameStrategy {
  /** Cómo se juega en el frontend: cada estilo tiene su propia pantalla de preguntas. */
  abstract readonly playStyle: PlayStyle;

  /** ¿La respuesta del jugador es correcta? */
  abstract isCorrect(question: Question, answer: string): boolean;

  /** XP de una partida completada. Por defecto: 10 por acierto × multiplicador de dificultad. */
  xpFor(correctAnswers: number, difficulty: GameDifficulty): number {
    return Math.round(correctAnswers * XP_PER_CORRECT * DIFFICULTY_MULTIPLIER[difficulty]);
  }
}
