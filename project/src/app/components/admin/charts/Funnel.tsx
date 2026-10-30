import { ORDINAL } from "./palette";

/** Embudo: cada etapa como barra (rampa ordinal), con su número y su % respecto a la primera. */
export default function Funnel({ steps }: { steps: Array<{ key: string; label: string; value: number }> }) {
  const first = steps[0]?.value || 0;
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const pct = first ? Math.round((step.value / first) * 100) : 0;
        return (
          <div key={step.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-foreground">{step.label}</span>
              <span className="text-foreground tabular-nums">
                <b>{step.value}</b> <span className="text-muted-foreground">· {pct}%</span>
              </span>
            </div>
            <div className="h-5 bg-muted rounded-md overflow-hidden">
              <div className="h-full rounded-md transition-all" style={{ width: `${first ? (step.value / first) * 100 : 0}%`, background: ORDINAL[Math.min(i, ORDINAL.length - 1)] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
