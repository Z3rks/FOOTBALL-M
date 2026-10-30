import type { ComponentType } from "react";
import type { AnswerResult, PlayStyle, PublicQuestion } from "../../api/types";

/** Lo que recibe la vista de una pregunta; la lógica de la partida vive en GamePlayScreen. */
export interface QuestionViewProps {
  question: PublicQuestion;
  /** Resultado de la respuesta (null mientras el jugador no ha respondido). */
  feedback: AnswerResult | null;
  /** Respuesta que envió el jugador. */
  picked: string | null;
  busy: boolean;
  onAnswer: (answer: string) => void;
}

/** Clases de la pantalla de juego para un estilo: cada minijuego puede tener su propio look. */
export interface PlayStyleTheme {
  screen: string;
  header: string;
  /** Color del texto e íconos del encabezado (según el fondo del encabezado). */
  headerText: string;
  subtitle: string;
  progressTrack: string;
  progressBar: string;
  button: string;
}

/** Un estilo de juego (patrón Strategy, igual que en el backend): su vista y su tema. */
export interface PlayStyleDefinition {
  View: ComponentType<QuestionViewProps>;
  theme: PlayStyleTheme;
}

export type { PlayStyle };
