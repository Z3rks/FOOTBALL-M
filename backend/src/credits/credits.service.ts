import { Injectable, NotFoundException } from '@nestjs/common';
import { UnitOfWork } from '../shared/database/unit-of-work';
import { CreditBalanceStore } from '../users/credit-balance.store';
import { CreditReason } from './entities/credit-transaction.entity';
import { CreditTransactionsRepository } from './repositories/credit-transactions.repository';

type EarnReason = Exclude<CreditReason, CreditReason.PURCHASE>;

/** Formas de ganar créditos de CreditsScreen (RF-115). Los montos solo se definen aquí. */
export const EARN_METHODS: Record<EarnReason, { method: string; credits: number }> = {
  [CreditReason.DAILY_CHALLENGE]: { method: 'Complete Daily Challenge', credits: 50 },
  [CreditReason.STREAK_7_DAYS]: { method: 'Maintain 7-day streak', credits: 100 },
  [CreditReason.SHARE_RESULT]: { method: 'Share your results', credits: 25 },
  [CreditReason.REFERRAL]: { method: 'Refer a friend', credits: 200 },
};

/** Saldo, recompensas e historial de créditos (Contrato de API §8). */
@Injectable()
export class CreditsService {
  constructor(
    private readonly transactions: CreditTransactionsRepository,
    private readonly balances: CreditBalanceStore,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /** GET /credits/balance — RF-114. */
  async getBalance(userId: string) {
    const balance = await this.balances.getBalance(userId);
    if (balance === null) throw new NotFoundException('User not found');
    return { balance };
  }

  /** GET /credits/earn-methods — RF-115. */
  listEarnMethods() {
    return Object.entries(EARN_METHODS).map(([reason, { method, credits }]) => ({ reason, method, credits }));
  }

  /** GET /credits/transactions — historial del libro contable, del más reciente al más antiguo. */
  async listTransactions(userId: string, page: number, limit: number) {
    const { rows, total } = await this.transactions.listByUser(userId, page, limit);
    const data = rows.map(({ id, amount, type, reason, referenceId, createdAt }) => ({ id, amount, type, reason, referenceId, createdAt }));
    return { data, total, page, limit };
  }

  /**
   * Da una recompensa. El movimiento y el saldo cambian en la misma transacción; si la misma
   * recompensa (motivo + referencia) ya se había pagado, no hace nada. Devuelve si se pagó.
   */
  earn(userId: string, reason: EarnReason, referenceId: string | null): Promise<boolean> {
    const amount = EARN_METHODS[reason].credits;
    return this.unitOfWork.run(async () => {
      if (!(await this.transactions.insertRewardOnce({ userId, amount, reason, referenceId }))) return false;
      await this.balances.addToBalance(userId, amount);
      return true;
    });
  }
}
