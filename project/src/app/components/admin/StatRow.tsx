/** Fila de indicadores (3 tarjetas iguales) arriba de las gráficas de una pantalla del panel. */
export default function StatRow({ stats }: { stats: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-card border border-border rounded-xl p-3 md:p-5 text-center shadow-sm">
          <p className="text-lg md:text-2xl font-bold text-foreground">{value}</p>
          <p className="text-[11px] md:text-xs text-muted-foreground leading-tight mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
