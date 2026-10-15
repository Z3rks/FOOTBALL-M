import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnitOfWork } from '../shared/database/unit-of-work';
import { DEFAULT_LOCALE, Locale, localize } from '../shared/i18n/locale';
import { DomainEvents, ItemPurchasedEvent } from '../shared/events/domain-events';
import { CreditBalanceStore, InsufficientCreditsError } from '../users/credit-balance.store';
import { CreditReason } from './entities/credit-transaction.entity';
import { CreditTransactionsRepository } from './repositories/credit-transactions.repository';
import { StoreRepository } from './repositories/store.repository';

/** Tienda de CreditsScreen (RF-117 a RF-120). */
@Injectable()
export class StoreService {
  constructor(
    private readonly store: StoreRepository,
    private readonly transactions: CreditTransactionsRepository,
    private readonly balances: CreditBalanceStore,
    private readonly events: EventEmitter2,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /** GET /store/items — con lo que el jugador ya tiene y si le alcanza (botón "Purchase" / "Not Enough"). */
  async listItems(userId: string, locale: Locale = DEFAULT_LOCALE) {
    const [items, ownedItems, balance] = await Promise.all([this.store.listItems(), this.store.listOwned(userId), this.balances.getBalance(userId)]);
    const ownedById = new Map(ownedItems.map((o) => [o.itemId, o]));
    return items.map((item) => ({
      id: item.id,
      name: localize(item, locale).name,
      type: item.itemType,
      cost: item.cost,
      icon: item.icon,
      owned: ownedById.has(item.id),
      equipped: ownedById.get(item.id)?.isEquipped ?? false,
      affordable: (balance ?? 0) >= item.cost,
    }));
  }

  /**
   * POST /store/items/:id/purchase — RF-119/RF-120. Todo ocurre en una transacción y las compras
   * de un mismo usuario se procesan de a una, así dos compras simultáneas no gastan el mismo
   * saldo (Plan de Seguridad §6, TC-43). El artículo comprado queda aplicado al perfil.
   */
  async purchase(userId: string, itemId: string) {
    const item = await this.store.findItem(itemId);
    if (!item) throw new NotFoundException('Item not found');

    const newBalance = await this.unitOfWork.run(async () => {
      await this.transactions.lockAccount(userId);
      if (await this.store.isOwned(userId, itemId)) throw new ConflictException('Item already owned');
      const balance = await this.balances.getBalance(userId);
      if (balance === null) throw new NotFoundException('User not found');
      if (balance < item.cost) throw new BadRequestException('Not enough credits');

      await this.store.addOwned(userId, item.id);
      await this.store.equipOnly(userId, item);
      await this.transactions.insertSpend({ userId, amount: item.cost, reason: CreditReason.PURCHASE, referenceId: item.id });
      try {
        return await this.balances.addToBalance(userId, -item.cost);
      } catch (error) {
        // Respaldo: la base de datos nunca deja el saldo en negativo.
        if (error instanceof InsufficientCreditsError) throw new BadRequestException('Not enough credits');
        throw error;
      }
    });

    await this.events.emitAsync(DomainEvents.ITEM_PURCHASED, new ItemPurchasedEvent(userId, item.id));
    return { purchased: true, item: { id: item.id, name: item.name, type: item.itemType, equipped: true }, newBalance };
  }

  /** POST /store/items/:id/equip — aplica al perfil un artículo ya comprado (uno por tipo). */
  async equip(userId: string, itemId: string) {
    const item = await this.store.findItem(itemId);
    if (!item || !(await this.store.isOwned(userId, itemId))) throw new NotFoundException('Item not owned');
    await this.unitOfWork.run(() => this.store.equipOnly(userId, item));
    return { item: { id: item.id, name: item.name, type: item.itemType, equipped: true } };
  }
}
