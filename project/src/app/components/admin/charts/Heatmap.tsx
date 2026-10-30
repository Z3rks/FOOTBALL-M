import { RAMP } from "./palette";

/** Mapa de calor: filas × columnas, cada celda con el tono de la rampa según su valor. */
export default function Heatmap({ rows, columns, value, format }: { rows: string[]; columns: string[]; value: (row: number, col: number) => number; format: (row: string, col: string, v: number) => string }) {
  const max = Math.max(1, ...rows.flatMap((_, r) => columns.map((__, c) => value(r, c))));
  const shade = (v: number) => (v === 0 ? "#f3f3f1" : RAMP[Math.min(RAMP.length - 1, Math.floor((v / max) * (RAMP.length - 1e-9)))]);
  return (
    <div>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `28px repeat(${columns.length}, minmax(0, 1fr))` }}>
        {rows.map((label, r) => (
          <div key={label} className="contents">
            <span className="text-[10px] text-muted-foreground leading-none self-center">{label}</span>
            {columns.map((col, c) => {
              const v = value(r, c);
              return <div key={col} className="aspect-square md:aspect-auto md:h-6 rounded-[2px]" style={{ background: shade(v) }} title={format(label, col, v)} />;
            })}
          </div>
        ))}
      </div>
      <div className="grid mt-1" style={{ gridTemplateColumns: `28px repeat(${columns.length}, minmax(0, 1fr))` }}>
        <span />
        {columns.map((col, c) => (
          <span key={col} className="text-[9px] text-muted-foreground text-center">
            {c % 6 === 0 ? col : ""}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-muted-foreground">
        <span>0</span>
        {RAMP.map((c) => (
          <span key={c} className="w-3 h-2 rounded-[2px]" style={{ background: c }} />
        ))}
        <span>{max}</span>
      </div>
    </div>
  );
}
