import { StoreItem } from '../entities/store-item.entity';
import { UserStoreItem } from '../entities/user-store-item.entity';

/** Repositorio de la tienda (STORE_ITEM) y de lo que tiene cada jugador (USER_STORE_ITEM). */
export abstract class StoreRepository {
  /** Del más barato al más caro. */
  abstract listItems(): Promise<StoreItem[]>;
  abstract findItem(id: string): Promise<StoreItem | null>;
  abstract listOwned(userId: string): Promise<UserStoreItem[]>;
  abstract isOwned(userId: string, itemId: string): Promise<boolean>;
  /** Registra la compra con el artículo ya aplicado. */
  abstract addOwned(userId: string, itemId: string): Promise<void>;
  /** Aplica el artículo y quita los demás del mismo tipo (un avatar, un marco…). */
  abstract equipOnly(userId: string, item: StoreItem): Promise<void>;
}
