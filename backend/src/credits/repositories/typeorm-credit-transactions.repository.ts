import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { CreditReason, CreditTransaction, CreditTransactionType } from '../entities/credit-transaction.entity';
import { CreditTransactionsRepository } from './credit-transactions.repository';

@Injectable()
export class TypeOrmCreditTransactionsRepository extends TypeOrmRepository implements CreditTransactionsRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  private get transactions() {
    return this.manager.getRepository(CreditTransaction);
  }

  lockAccount(userId: string): Promise<void> {
    return this.lockKey(`credits:account:${userId}`);
  }

  async listByUser(userId: string, page: number, limit: number) {
    const [rows, total] = await this.transactions.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { rows, total };
  }

  async insertRewardOnce(reward: { userId: string; amount: number; reason: CreditReason; referenceId: string | null }): Promise<boolean> {
    const result = await this.transactions
      .createQueryBuilder()
      .insert()
      .values({ ...reward, type: CreditTransactionType.EARN })
      .orIgnore() // índice UQ_credit_transactions_reward_once
      .returning('id')
      .execute();
    return result.raw.length > 0;
  }

  async insertSpend(spend: { userId: string; amount: number; reason: CreditReason; referenceId: string }): Promise<void> {
    await this.transactions.insert({ ...spend, amount: -spend.amount, type: CreditTransactionType.SPEND });
  }
}
