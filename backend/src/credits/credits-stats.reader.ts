import { Locale } from '../shared/i18n/locale';

/** Motivos por los que un jugador gana créditos (los montos viven en el backend). */
export type EarnReason = 'daily_challenge' | 'streak_7_days' | 'share_result' | 'referral';

/**
 * Interfaz pública de Credits para las métricas del panel administrativo (Facade, Arquitectura §6):
 * movimientos de créditos y compras de la tienda. Fechas YYYY-MM-DD en APP_TIMEZONE; los rangos
 * incluyen ambos extremos.
 */
export abstract class CreditsStatsReader {
  /** Créditos ganados y gastados cada día del rango (incluidos los días sin movimientos). */
  abstract dailyFlow(from: string, to: string): Promise<Array<{ date: string; earned: number; spent: number }>>;
  /** Créditos ganados en el rango por cada motivo (todos, aunque tengan 0). */
  abstract earnedByReason(from: string, to: string): Promise<Array<{ reason: EarnReason; credits: number }>>;
  /** Créditos en manos de los jugadores al final de cada día del rango. */
  abstract circulation(from: string, to: string): Promise<Array<{ date: string; credits: number }>>;
  /** Cada artículo de la tienda con sus compras (de todos los tiempos), de más a menos comprado. */
  abstract itemPurchases(locale: Locale): Promise<Array<{ itemId: string; name: string; icon: string; type: string; cost: number; purchases: number }>>;
}
