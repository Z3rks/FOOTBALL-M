import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnitOfWork } from '../shared/database/unit-of-work';
import { DomainEvents, ItemPurchasedEvent } from '../shared/events/domain-events';
import { CreditBalanceStore, InsufficientCreditsError } from '../users/credit-balance.store';
import { CreditReason } from './entities/credit-transaction.entity';
import { StoreItem, StoreItemType } from './entities/store-item.entity';
import { UserStoreItem } from './entities/user-store-item.entity';
import { CreditTransactionsRepository } from './repositories/credit-transactions.repository';
import { StoreRepository } from './repositories/store.repository';
import { StoreService } from './store.service';

/*
 * StoreService solo depende de interfaces (Arquitectura §7, inversión de dependencias): aquí
 * se prueba con implementaciones en memoria, sin base de datos.
 */

const item = (id: string, cost: number, itemType = StoreItemType.AVATAR): StoreItem => ({ id, name: `Item ${id}`, itemType, cost, icon: '⚽', translations: null });

class InMemoryStore extends StoreRepository {
  items = [item('cheap', 100), item('pricey', 500), item('frame', 150, StoreItemType.BADGE_FRAME)];
  owned: UserStoreItem[] = [];

  async listItems() {
    return [...this.items].sort((a, b) => a.cost - b.cost);
  }
  async findItem(id: string) {
    return this.items.find((i) => i.id === id) ?? null;
  }
  async listOwned(userId: string) {
    return this.owned.filter((o) => o.userId === userId);
  }
  async isOwned(userId: string, itemId: string) {
    return this.owned.some((o) => o.userId === userId && o.itemId === itemId);
  }
  async addOwned(userId: string, itemId: string) {
    this.owned.push({ userId, itemId, isEquipped: true } as UserStoreItem);
  }
  async equipOnly(userId: string, target: StoreItem) {
    for (const o of this.owned.filter((x) => x.userId === userId)) {
      const type = this.items.find((i) => i.id === o.itemId)!.itemType;
      if (type === target.itemType) o.isEquipped = o.itemId === target.id;
    }
  }
}

class InMemoryLedger extends CreditTransactionsRepository {
  spends: Array<{ userId: string; amount: number; reason: CreditReason; referenceId: string }> = [];
  locked: string[] = [];

  async lockAccount(userId: string) {
    this.locked.push(userId);
  }
  async listByUser() {
    return { rows: [], total: 0 };
  }
  async insertRewardOnce() {
    return true;
  }
  async insertSpend(spend: { userId: string; amount: number; reason: CreditReason; referenceId: string }) {
    this.spends.push(spend);
  }
}

class InMemoryBalances extends CreditBalanceStore {
  constructor(public balances: Record<string, number>) {
    super();
  }
  async getBalance(userId: string) {
    return this.balances[userId] ?? null;
  }
  async addToBalance(userId: string, delta: number) {
    if (this.balances[userId] + delta < 0) throw new InsufficientCreditsError();
    return (this.balances[userId] += delta);
  }
}

/** Sin base de datos, la "transacción" solo ejecuta el trabajo. */
class ImmediateUnitOfWork extends UnitOfWork {
  runs = 0;
  run<T>(work: () => Promise<T>) {
    this.runs++;
    return work();
  }
}

describe('StoreService', () => {
  let store: InMemoryStore;
  let ledger: InMemoryLedger;
  let balances: InMemoryBalances;
  let unitOfWork: ImmediateUnitOfWork;
  let events: { emitAsync: jest.Mock };
  let service: StoreService;

  beforeEach(() => {
    store = new InMemoryStore();
    ledger = new InMemoryLedger();
    balances = new InMemoryBalances({ ana: 300 });
    unitOfWork = new ImmediateUnitOfWork();
    events = { emitAsync: jest.fn().mockResolvedValue([]) };
    service = new StoreService(store, ledger, balances, events as unknown as EventEmitter2, unitOfWork);
  });

  it('lista los artículos con lo que tiene el jugador y si le alcanza', async () => {
    await store.addOwned('ana', 'frame');
    const items = await service.listItems('ana');
    expect(items.map((i) => [i.id, i.owned, i.affordable])).toEqual([
      ['cheap', false, true],
      ['frame', true, true],
      ['pricey', false, false],
    ]);
  });

  it('compra: descuenta el saldo, registra el gasto, aplica el artículo y emite ItemPurchasedEvent', async () => {
    const result = await service.purchase('ana', 'cheap');

    expect(result).toEqual({ purchased: true, item: { id: 'cheap', name: 'Item cheap', type: StoreItemType.AVATAR, equipped: true }, newBalance: 200 });
    expect(ledger.spends).toEqual([{ userId: 'ana', amount: 100, reason: CreditReason.PURCHASE, referenceId: 'cheap' }]);
    expect(ledger.locked).toEqual(['ana']);
    expect(unitOfWork.runs).toBe(1);
    expect(events.emitAsync).toHaveBeenCalledWith(DomainEvents.ITEM_PURCHASED, new ItemPurchasedEvent('ana', 'cheap'));
  });

  it('al comprar otro avatar, el anterior deja de estar aplicado', async () => {
    store.items.push(item('cheap2', 50));
    await service.purchase('ana', 'cheap');
    await service.purchase('ana', 'cheap2');
    expect(store.owned.map((o) => [o.itemId, o.isEquipped])).toEqual([
      ['cheap', false],
      ['cheap2', true],
    ]);
  });

  it('400 si no alcanza el saldo, sin tocar nada', async () => {
    await expect(service.purchase('ana', 'pricey')).rejects.toThrow(new BadRequestException('Not enough credits'));
    expect(balances.balances.ana).toBe(300);
    expect(ledger.spends).toEqual([]);
    expect(events.emitAsync).not.toHaveBeenCalled();
  });

  it('409 si ya lo tenía', async () => {
    await store.addOwned('ana', 'cheap');
    await expect(service.purchase('ana', 'cheap')).rejects.toBeInstanceOf(ConflictException);
  });

  it('404 si el artículo no existe', async () => {
    await expect(service.purchase('ana', 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('equip: solo aplica artículos comprados', async () => {
    await expect(service.equip('ana', 'cheap')).rejects.toBeInstanceOf(NotFoundException);
    await store.addOwned('ana', 'cheap');
    await expect(service.equip('ana', 'cheap')).resolves.toMatchObject({ item: { id: 'cheap', equipped: true } });
  });
});
