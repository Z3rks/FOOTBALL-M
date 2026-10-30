import type { LucideIcon } from "lucide-react";
import { ArrowRightLeft, Banknote, Building2, CalendarClock, Gamepad2, Link2, MonitorPlay, ScanFace, Shield, Star, UserSearch } from "lucide-react";

/**
 * Ícono de cada minijuego: la API envía su nombre (Game.icon) y aquí se dibuja con el color del
 * estilo del minijuego (el mismo de su pantalla de juego, ver playStyles.ts).
 */
const GAME_ICONS: Record<string, { Icon: LucideIcon; color: string }> = {
  "user-search": { Icon: UserSearch, color: "#4F46E5" },
  "scan-face": { Icon: ScanFace, color: "#7C3AED" },
  shield: { Icon: Shield, color: "#DC2626" },
  building: { Icon: Building2, color: "#16A34A" },
  link: { Icon: Link2, color: "#EA580C" },
  "calendar-clock": { Icon: CalendarClock, color: "#D99A06" },
  "arrow-right-left": { Icon: ArrowRightLeft, color: "#0D9488" },
  banknote: { Icon: Banknote, color: "#059669" },
  star: { Icon: Star, color: "#15803D" },
  "monitor-play": { Icon: MonitorPlay, color: "#0F172A" },
};
const FALLBACK = { Icon: Gamepad2, color: "#1A5276" };

const SIZES = {
  sm: { box: "w-8 h-8 rounded-lg", icon: "w-4 h-4" },
  md: { box: "w-11 h-11 rounded-xl", icon: "w-5 h-5" },
  lg: { box: "w-14 h-14 rounded-2xl", icon: "w-7 h-7" },
};

interface GameIconProps {
  icon: string;
  size?: keyof typeof SIZES;
  /** "tile": recuadro de color suave (catálogo, Home); "plain": solo el ícono (sobre fondos de color). */
  variant?: "tile" | "plain";
  className?: string;
}

export default function GameIcon({ icon, size = "md", variant = "tile", className = "" }: GameIconProps) {
  const { Icon, color } = GAME_ICONS[icon] ?? FALLBACK;
  const s = SIZES[size];
  if (variant === "plain") return <Icon className={`${s.icon} ${className}`} aria-hidden />;
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${s.box} ${className}`} style={{ background: `${color}1A`, color }} aria-hidden>
      <Icon className={s.icon} strokeWidth={2.2} />
    </span>
  );
}
