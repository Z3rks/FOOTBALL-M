/**
 * Kit de gráficas del panel de administración. Una pieza por archivo:
 * - ChartCard: tarjeta común (título, pregunta que responde, estado vacío y "Ver tabla").
 * - PeriodSelector: filtro de 7, 30 o 90 días.
 * - ColumnChart y TrendChart: columnas y líneas/áreas en el tiempo (Recharts).
 * - BarList, StackedBarList, Heatmap, Funnel y Sparkline: HTML + CSS, se adaptan al ancho de su tarjeta.
 * - palette: colores validados para daltonismo.
 */
export { default as BarList } from "./BarList";
export type { BarRow } from "./BarList";
export { default as ChartCard } from "./ChartCard";
export type { ChartQuery, ChartTable } from "./ChartCard";
export { default as ChartTooltip } from "./ChartTooltip";
export { default as ColumnChart } from "./ColumnChart";
export type { ChartSeries } from "./ColumnChart";
export { default as Funnel } from "./Funnel";
export { default as Heatmap } from "./Heatmap";
export { default as PeriodSelector, PERIODS } from "./PeriodSelector";
export type { Period } from "./PeriodSelector";
export { default as Sparkline } from "./Sparkline";
export { default as StackedBarList } from "./StackedBarList";
export type { StackedRow } from "./StackedBarList";
export { default as TrendChart } from "./TrendChart";
export { AXIS_TICK, INK, ORDINAL, RAMP, SERIES } from "./palette";
