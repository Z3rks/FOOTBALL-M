import { ReactNode } from "react";
import { Trophy } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface TopNavProps {
  items: NavItem[];
  active: string;
  onNavigate: (screen: string) => void;
  /** Texto pequeño bajo el nombre de la app (ej. "Portal de administración"). */
  badge?: string;
  /** Fondo de la barra: el jugador usa el azul de la marca y el admin el azul oscuro. */
  tone?: "primary" | "secondary";
  /** Contenido a la derecha: idioma, usuario, salir. */
  right?: ReactNode;
}

/**
 * Barra de navegación superior de la app web. Desde 1280 px las secciones van junto al logo; en
 * pantallas más angostas (celular, tableta, laptop pequeña) pasan a una segunda fila que se
 * desplaza de lado, porque las 6 del portal de administración no caben junto al logo.
 */
export default function TopNav({ items, active, onNavigate, badge, tone = "primary", right }: TopNavProps) {
  const links = items.map(({ id, label, icon: Icon }) => {
    const isActive = id === active;
    return (
      <button
        key={id}
        onClick={() => onNavigate(id)}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
          isActive ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? "text-accent" : ""}`} />
        {label}
      </button>
    );
  });

  return (
    <header className={`${tone === "primary" ? "bg-primary" : "bg-secondary"} shadow-md sticky top-0 z-30`}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-3 xl:gap-6 h-16">
          {/* El logo puede encogerse en celular; los botones de la derecha nunca (ej. "Salir"). */}
          <button onClick={() => onNavigate(items[0].id)} className="flex items-center gap-2.5 min-w-0 xl:flex-shrink-0" aria-label="Football Maestro">
            <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-accent" />
            </span>
            <span className="text-left leading-tight min-w-0">
              <span className="block text-white font-bold truncate">Football Maestro</span>
              {badge && <span className="hidden sm:block text-white/50 text-[10px] font-bold uppercase tracking-widest truncate">{badge}</span>}
            </span>
          </button>
          <nav className="hidden xl:flex items-center gap-1 flex-1">{links}</nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-shrink-0">{right}</div>
        </div>
        <nav className="xl:hidden flex items-center gap-1 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1">{links}</nav>
      </div>
    </header>
  );
}
