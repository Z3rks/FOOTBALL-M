import { Line, LineChart, ResponsiveContainer } from "recharts";
import { SERIES } from "./palette";

/** Mini gráfica de tendencia (sin ejes) para las tarjetas de KPI. */
export default function Sparkline({ values, color = SERIES[0] }: { values: Array<number | null>; color?: string }) {
  const data = values.map((v, i) => ({ i, v }));
  if (data.every((d) => d.v === null)) return null;
  return (
    <div className="h-8 mt-2" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
          <Line type="linear" dataKey="v" stroke={color} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
