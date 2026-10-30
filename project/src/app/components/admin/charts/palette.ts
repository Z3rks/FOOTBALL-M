/**
 * Colores de las gráficas del panel de administración. Es la paleta de referencia validada con
 * validate_palette.js sobre el fondo blanco de las tarjetas: separación suficiente para
 * daltonismo (protan, deutan, tritan) y visión normal. Aqua y amarillo quedan por debajo de 3:1
 * de contraste, así que toda gráfica ofrece también su tabla ("Ver tabla").
 *
 * Reglas: una sola serie usa siempre SERIES[0]; los colores se asignan en este orden fijo y
 * siguen a la entidad (no a su posición); nunca se generan colores nuevos.
 */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"] as const;

/** Rampa de un solo tono (azul) para magnitud: mapa de calor. Paso 100 = casi cero. */
export const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"] as const;

/** Rampa ordinal (pasos ordenados, como las etapas del embudo); el más claro se distingue del fondo. */
export const ORDINAL = ["#86b6ef", "#3987e5", "#256abf", "#104281"] as const;

/** Tinta del texto y del "chrome" de las gráficas (ejes y cuadrícula recesivos). */
export const INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  /** Gris para lo que no es el foco (forma de énfasis). */
  deemphasis: "#d6d5cf",
} as const;

/** Estilo de las marcas de los ejes de Recharts. */
export const AXIS_TICK = { fontSize: 10, fill: INK.muted } as const;
