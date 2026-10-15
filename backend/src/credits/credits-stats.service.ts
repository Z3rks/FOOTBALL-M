import { Injectable } from '@nestjs/common';
import { Locale, localize } from '../shared/i18n/locale';
import { AppClock } from '../shared/time/app-clock';
import { CreditsStatsReader, EarnReason } from './credits-stats.reader';
import { CreditsStatsRepository } from './repositories/credits-stats.repository';

/** Motivos de ganancia, en el orden en que se muestran. */
const EARN_REASONS: EarnReason[] = ['daily_challenge', 'streak_7_days', 'share_result', 'referral'];

/** Implementación de CreditsStatsReader: métricas de la economía de créditos para el panel administrativo. */
@Injectable()
export class CreditsStatsService extends CreditsStatsReader {
  constructor(
    private readonly stats: CreditsStatsRepository,
    private readonly clock: AppClock,
  ) {
    super();
  }

  private get tz(): string {
    return this.clock.timeZone;
  }

  dailyFlow(from: string, to: string): Promise<Array<{ date: string; earned: number; spent: number }>> {
    return this.stats.dailyFlow(from, to, this.tz);
  }

  async earnedByReason(from: string, to: string): Promise<Array<{ reason: EarnReason; credits: number }>> {
    const rows = await this.stats.earnedByReason(from, to, this.tz);
    return EARN_REASONS.map((reason) => ({ reason, credits: rows.find((r) => r.reason === reason)?.credits ?? 0 }));
  }

  circulation(from: string, to: string): Promise<Array<{ date: string; credits: number }>> {
    return this.stats.balanceAtEndOfDay(from, to, this.tz);
  }

  async itemPurchases(locale: Locale) {
    const rows = await this.stats.itemPurchases();
    return rows.map((item) => ({ itemId: item.id, name: localize(item, locale).name, icon: item.icon, type: item.itemType, cost: item.cost, purchases: item.purchases }));
  }
}
