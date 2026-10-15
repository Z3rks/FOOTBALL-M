import { Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { addDays } from '../shared/time/app-date';

/** Períodos que puede elegir el administrador en las gráficas (últimos N días). */
export const PERIOD_DAYS = [7, 30, 90] as const;
export type PeriodDays = (typeof PERIOD_DAYS)[number];
export const DEFAULT_PERIOD_DAYS: PeriodDays = 30;

/** ?days=7|30|90 (por defecto 30). */
export class PeriodQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn(PERIOD_DAYS)
  days: PeriodDays = DEFAULT_PERIOD_DAYS;
}

/** Los últimos `days` días hasta `today`, incluido (YYYY-MM-DD). */
export function periodRange(today: string, days: number): { from: string; to: string } {
  return { from: addDays(today, -(days - 1)), to: today };
}

/** ?days=7|30|90 opcional: sin él, la gráfica es de todos los tiempos. */
export class OptionalPeriodQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn(PERIOD_DAYS)
  days?: PeriodDays;
}
