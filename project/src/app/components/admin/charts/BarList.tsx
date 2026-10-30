import { ReactNode } from "react";
import { INK, SERIES } from "./palette";

export interface BarRow {
  key: string;
  label: string;
  /** Adorno opcional antes de la etiqueta (ícono del minijuego, bandera, emoji). */
  icon?: ReactNode;
  /** Detalle opcional debajo de la etiqueta (ej. minijuego y respuesta de una pregunta). */
  hint?: string;
  value: number | null;
  /** Texto del valor; por defecto el número. */
  display?: string;
}

interface BarListProps {
  rows: BarRow[];
  /** Valor de una barra llena (ej. 100 para porcentajes); por defecto, el mayor de la lista. */
  max?: number;
  /** Línea vertical para comparar cada barra (ej. el promedio). */
  reference?: { value: number; label: string };
}

/**
 * Barras horizontales de una sola serie, con la etiqueta arriba y el valor escrito a la derecha.
 * Se leen bien en celular aunque los nombres sean largos.
 */
export default function BarList({ rows, max, reference }: BarListProps) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value ?? 0), reference?.value ?? 0);
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="flex items-start gap-1.5 min-w-0 text-xs font-medium text-foreground">
              {row.icon}
              <span className="min-w-0">
                <span className={row.hint ? "line-clamp-2" : "block truncate"}>{row.label}</span>
                {row.hint && <span className="block text-[11px] font-normal text-muted-foreground truncate">{row.hint}</span>}
              </span>
            </span>
            <span className="text-xs font-semibold text-foreground tabular-nums flex-shrink-0">{row.display ?? row.value ?? "—"}</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full">
            <div className="h-full rounded-full transition-all" style={{ width: `${((row.value ?? 0) / top) * 100}%`, background: SERIES[0] }} />
            {reference && (
              <div className="absolute -top-1 -bottom-1 w-0.5 rounded-full" style={{ left: `${(reference.value / top) * 100}%`, background: INK.primary }} title={reference.label} />
            )}
          </div>
        </div>
      ))}
      {reference && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
          <span className="inline-block w-0.5 h-3 rounded-full" style={{ background: INK.primary }} />
          {reference.label}
        </p>
      )}
    </div>
  );
}
