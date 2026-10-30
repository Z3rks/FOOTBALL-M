import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Kpi } from "../../api/types";
import { formatChange } from "../../format";
import { Sparkline } from "./charts";

interface KpiTileProps {
  label: string;
  kpi: Kpi | undefined;
  /** Unidad de la variación ("%" o " pts"). */
  unit?: string;
  format: (value: number) => string;
  icon: React.ElementType;
  /** Color del ícono y fondo de la tarjeta (identidad de cada KPI en la maqueta). */
  color: string;
  bg: string;
  /** Valores de los últimos 7 días para la mini tendencia (RF-173). */
  trend?: Array<number | null>;
}

/** Tarjeta de KPI del Dashboard (RF-123): valor, variación con flecha y mini tendencia. */
export default function KpiTile({ label, kpi, unit = "%", format, icon: Icon, color, bg, trend }: KpiTileProps) {
  const change = kpi?.change ?? null;
  const tone = change === null || change === 0 ? "text-muted-foreground" : change > 0 ? "text-emerald-600" : "text-red-500";
  const TrendIcon = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm">
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${tone}`}>
          <TrendIcon className="w-3 h-3" />
          {formatChange(change, unit)}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{kpi?.value === null || kpi === undefined ? "–" : format(kpi.value)}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {trend && <Sparkline values={trend} />}
    </div>
  );
}
