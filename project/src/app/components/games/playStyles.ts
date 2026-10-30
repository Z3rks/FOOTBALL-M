import CareerView from "./CareerView";
import CluesView from "./CluesView";
import ConnectionsView from "./ConnectionsView";
import CrestView from "./CrestView";
import LineupView from "./LineupView";
import MultipleChoiceView from "./MultipleChoiceView";
import SilhouetteView from "./SilhouetteView";
import StadiumView from "./StadiumView";
import TimelineView from "./TimelineView";
import ValueView from "./ValueView";
import VarView from "./VarView";
import type { PlayStyle, PlayStyleDefinition, PlayStyleTheme } from "./types";

/** Todos los minijuegos usan fondo blanco; cada uno tiene el encabezado y los botones de su color. */
function theme(color: string, onColor = "text-white"): PlayStyleTheme {
  return {
    screen: "bg-background",
    header: `shadow-md ${color}`,
    headerText: onColor,
    subtitle: onColor === "text-white" ? "text-white/80" : "opacity-70",
    progressTrack: onColor === "text-white" ? "bg-white/25" : "bg-black/10",
    progressBar: onColor === "text-white" ? "bg-white" : "bg-[#1a1a1a]",
    button: `${color} ${onColor} hover:brightness-110`,
  };
}

/**
 * Estilo de cada minijuego (patrón Strategy, igual que GameFactory en el backend). La API indica
 * el estilo de la partida (playStyle); para cambiar el look de un minijuego se edita su vista.
 */
export const PLAY_STYLES: Record<PlayStyle, PlayStyleDefinition> = {
  "multiple-choice": {
    View: MultipleChoiceView,
    theme: {
      screen: "bg-background",
      header: "bg-primary shadow-md",
      headerText: "text-white",
      subtitle: "text-accent",
      progressTrack: "bg-white/20",
      progressBar: "bg-accent",
      button: "bg-primary text-primary-foreground hover:bg-secondary",
    },
  },
  clues: { View: CluesView, theme: theme("bg-[#4F46E5]") },
  silhouette: { View: SilhouetteView, theme: theme("bg-[#7C3AED]") },
  crest: { View: CrestView, theme: theme("bg-[#DC2626]") },
  stadium: { View: StadiumView, theme: theme("bg-[#16A34A]") },
  connections: { View: ConnectionsView, theme: theme("bg-[#EA580C]") },
  timeline: { View: TimelineView, theme: theme("bg-[#F0B429]", "text-[#1a1a1a]") },
  career: { View: CareerView, theme: theme("bg-[#0D9488]") },
  value: { View: ValueView, theme: theme("bg-[#059669]") },
  lineup: { View: LineupView, theme: theme("bg-[#15803D]") },
  var: { View: VarView, theme: theme("bg-slate-900") },
};
