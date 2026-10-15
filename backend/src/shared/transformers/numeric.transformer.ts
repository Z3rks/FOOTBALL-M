import { ValueTransformer } from 'typeorm';

/** PostgreSQL devuelve las columnas numeric como texto; esto las convierte a number. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};
