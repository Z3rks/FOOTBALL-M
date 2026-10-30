import { ReactNode } from "react";
import { SERIES } from "./palette";

export interface StackedRow {
  key: string;
  label: string;
  icon?: ReactNode;
  /** Un valor por serie, en el mismo orden que `series`. */
  values: number[];
  /** Texto a la derecha (ej. "12 · 25 % abandono"). */
  display?: string;
}

/** Barras horizontales apiladas: cada fila suma sus series (en valores absolutos, escala común). */
export default function StackedBarList({ rows, series }: { rows: StackedRow[]; series: string[] }) {
  const top = Math.max(1, ...rows.map((r) => r.values.reduce((a, b) => a + b, 0)));
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="flex items-center gap-1.5 min-w-0 text-xs font-medium text-foreground">
              {row.icon}
              <span className="truncate">{row.label}</span>
            </span>
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">{row.display}</span>
          </div>
          <div className="flex h-2 gap-0.5">
            {row.values.map((value, i) =>
              value > 0 ? (
                <div
                  key={series[i]}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(value / top) * 100}%`, background: SERIES[i] }}
                  title={`${series[i]}: ${value}`}
                />
              ) : null,
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
