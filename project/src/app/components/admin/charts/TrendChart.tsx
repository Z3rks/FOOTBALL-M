import { useId } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartSeries } from "./ColumnChart";
import ChartTooltip from "./ChartTooltip";
import { AXIS_TICK, INK, SERIES } from "./palette";

interface TrendChartProps<T> {
  data: T[];
  /** Campo de cada fila que va en el eje X (normalmente la fecha ya formateada). */
  x: keyof T & string;
  series: ChartSeries[];
  height?: number;
  /** Área rellena bajo la línea (solo para una serie). */
  area?: boolean;
  /** Puntos en cada valor (útil con pocos puntos, ej. 7 días). */
  dots?: boolean;
  format?: (value: number) => string;
  formatY?: (value: number) => string;
  /** Rango fijo del eje Y (ej. [0, 100] para porcentajes). */
  yDomain?: [number, number];
  yUnit?: string;
}

/** Evolución en el tiempo: una o más líneas (o un área) con los estilos del panel. */
export default function TrendChart<T>({ data, x, series, height = 140, area = false, dots = false, format, formatY, yDomain, yUnit }: TrendChartProps<T>) {
  // Los ids de React llevan ":", que no sirve dentro de url(#...) en algunos navegadores.
  const gradientId = `trend-${useId().replace(/:/g, "")}`;
  const dotFor = (color: string) => (dots ? { r: 4, fill: color, stroke: "#fff", strokeWidth: 2 } : false);
  const axes = (
    <>
      <CartesianGrid stroke={INK.grid} vertical={false} />
      <XAxis dataKey={x} tick={AXIS_TICK} axisLine={{ stroke: INK.axis }} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
      <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={formatY} domain={yDomain} unit={yUnit} />
      <Tooltip cursor={{ stroke: INK.axis }} content={<ChartTooltip format={format} />} />
    </>
  );
  const margin = { top: 4, right: 8, left: -20, bottom: 0 };

  if (area) {
    const [s] = series;
    const color = s.color ?? SERIES[0];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {axes}
          <Area type="monotone" dataKey={s.key} name={s.name} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={dotFor(color)} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={margin}>
        {axes}
        {series.map((s, i) => {
          const color = s.color ?? SERIES[i];
          return <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={color} strokeWidth={2} connectNulls dot={dotFor(color)} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />;
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
