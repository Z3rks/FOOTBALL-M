import { StoreItem } from '../entities/store-item.entity';

/**
 * Consultas de estadísticas sobre CREDIT_TRANSACTION y USER_STORE_ITEM para el panel
 * administrativo. Fechas YYYY-MM-DD en la zona `tz`; los rangos incluyen ambos extremos.
 */
export abstract class CreditsStatsRepository {
  abstract dailyFlow(from: string, to: string, tz: string): Promise<Array<{ date: string; earned: number; spent: number }>>;
  abstract earnedByReason(from: string, to: string, tz: string): Promise<Array<{ reason: string; credits: number }>>;
  /** Suma de todos los movimientos hasta el final de cada día del rango. */
  abstract balanceAtEndOfDay(from: string, to: string, tz: string): Promise<Array<{ date: string; credits: number }>>;
  abstract itemPurchases(): Promise<Array<Pick<StoreItem, 'id' | 'name' | 'icon' | 'itemType' | 'cost' | 'translations'> & { purchases: number }>>;
}
