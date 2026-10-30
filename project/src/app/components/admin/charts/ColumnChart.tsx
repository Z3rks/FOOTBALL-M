import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { AXIS_TICK, INK, SERIES } from "./palette";

export interface ChartSeries {
  key: string;
  /** Nombre para el tooltip (y la leyenda de ChartCard) cuando hay 2 o más series. */
  name?: string;
  /** Por defecto, el color de la serie según su posición en la paleta. */
  color?: string;
}

interface ColumnChartProps<T> {
  data: T[];
  /** Campo de cada fila que va en el eje X. */
  x: keyof T & string;
  /** Una o más series de columnas (varias = columnas agrupadas). */
  series: ChartSeries[];
  height?: number;
  /** Texto de los valores en el tooltip. */
  format?: (value: number) => string;
  /** Texto del encabezado del tooltip. */
  formatLabel?: (label: string | number) => string;
  /** Formato de las marcas del eje Y (ej. números compactos). */
  formatY?: (value: number) => string;
  /** Forma de énfasis: solo las filas destacadas van en color; el resto en gris. */
  highlight?: (row: T) => boolean;
  /** Sin eje Y ni cuadrícula (gráficas pequeñas, como la del detalle de un jugador). */
  compact?: boolean;
  /** Mostrar todas las etiquetas del eje X (ejes cortos: puntajes, niveles, rangos); si no, se omiten las que no caben. */
  allTicks?: boolean;
}

/** Columnas verticales con los estilos del panel: marcas delgadas, puntas redondeadas y ejes recesivos. */
export default function ColumnChart<T>({ data, x, series, height = 140, format, formatLabel, formatY, highlight, compact = false, allTicks = false }: ColumnChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: compact ? 0 : -20, bottom: 0 }} barGap={2} barCategoryGap={series.length > 1 ? "20%" : 2}>
        {!compact && <CartesianGrid stroke={INK.grid} vertical={false} />}
        <XAxis dataKey={x} tick={AXIS_TICK} axisLine={{ stroke: INK.axis }} tickLine={false} interval={allTicks ? 0 : "preserveStartEnd"} minTickGap={compact ? 40 : 16} />
        {!compact && <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={formatY} />}
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} content={<ChartTooltip format={format} formatLabel={formatLabel} />} />
        {series.map((s, i) => {
          const color = s.color ?? SERIES[i];
          return (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={color} radius={compact ? [2, 2, 0, 0] : [4, 4, 0, 0]}>
              {highlight && data.map((row, r) => <Cell key={r} fill={highlight(row) ? color : INK.deemphasis} />)}
            </Bar>
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
