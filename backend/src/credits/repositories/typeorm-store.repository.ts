import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { StoreItem } from '../entities/store-item.entity';
import { UserStoreItem } from '../entities/user-store-item.entity';
import { StoreRepository } from './store.repository';

@Injectable()
export class TypeOrmStoreRepository extends TypeOrmRepository implements StoreRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  private get items() {
    return this.manager.getRepository(StoreItem);
  }

  private get owned() {
    return this.manager.getRepository(UserStoreItem);
  }

  listItems(): Promise<StoreItem[]> {
    return this.items.find({ order: { cost: 'ASC', name: 'ASC' } });
  }

  findItem(id: string): Promise<StoreItem | null> {
    return this.items.findOneBy({ id });
  }

  listOwned(userId: string): Promise<UserStoreItem[]> {
    return this.owned.findBy({ userId });
  }

  isOwned(userId: string, itemId: string): Promise<boolean> {
    return this.owned.existsBy({ userId, itemId });
  }

  async addOwned(userId: string, itemId: string): Promise<void> {
    await this.owned.insert({ userId, itemId, isEquipped: true });
  }

  async equipOnly(userId: string, item: StoreItem): Promise<void> {
    const sameType = await this.items.findBy({ itemType: item.itemType });
    await this.owned.update({ userId, itemId: In(sameType.map((i) => i.id)) }, { isEquipped: false });
    await this.owned.update({ userId, itemId: item.id }, { isEquipped: true });
  }
}
