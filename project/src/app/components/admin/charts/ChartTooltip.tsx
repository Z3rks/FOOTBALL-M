import { SERIES } from "./palette";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; color?: string; name?: string }>;
  label?: string | number;
  /** Texto de cada valor (ej. "3 jugadores"). */
  format?: (value: number) => string;
  /** Texto del encabezado (ej. "Puntaje 7/10"); por defecto la etiqueta del eje X. */
  formatLabel?: (label: string | number) => string;
}

/** Tooltip de las gráficas de Recharts: encabezado y, por serie, un cuadro de color y su valor. */
export default function ChartTooltip({ active, payload, label, format = String, formatLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      {label !== undefined && <p className="font-semibold text-foreground mb-1">{formatLabel ? formatLabel(label) : label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-foreground">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color ?? SERIES[0] }} />
          {payload.length > 1 && p.name && <span className="text-muted-foreground">{p.name}:</span>}
          <span className="font-semibold tabular-nums">{format(p.value)}</span>
        </p>
      ))}
    </div>
  );
}
