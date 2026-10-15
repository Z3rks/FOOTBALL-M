import { Injectable } from '@nestjs/common';
import { CreditsStatsReader } from '../../credits/credits-stats.reader';
import { Locale } from '../../shared/i18n/locale';
import { mondayOf } from '../../shared/time/app-date';
import { PlayersBreakdownReader } from '../../users/players-breakdown.reader';
import { AppClock } from '../../shared/time/app-clock';
import { periodRange } from '../period';

/** Hasta este período el flujo de créditos se muestra por día; en períodos más largos, por semana. */
const DAILY_FLOW_MAX_DAYS = 7;

/** AdminEconomyScreen (Contrato de API §9.6). Facade sobre las estadísticas de Credits y de insignias (Users). */
@Injectable()
export class AdminEconomyService {
  constructor(
    private readonly creditsStats: CreditsStatsReader,
    private readonly breakdown: PlayersBreakdownReader,
    private readonly clock: AppClock,
  ) {}

  private range(days: number) {
    return periodRange(this.clock.today(), days);
  }

  /**
   * GET /admin/economy/flow — RF-161. Créditos ganados y gastados por día (7 días) o por
   * semana (30 y 90 días; cada punto empieza el lunes de su semana).
   */
  async flow(days: number) {
    const { from, to } = this.range(days);
    const daily = await this.creditsStats.dailyFlow(from, to);
    if (days <= DAILY_FLOW_MAX_DAYS) return { granularity: 'day' as const, points: daily.map(({ date, earned, spent }) => ({ start: date, earned, spent })) };

    const weeks = new Map<string, { start: string; earned: number; spent: number }>();
    for (const { date, earned, spent } of daily) {
      const start = mondayOf(date);
      const week = weeks.get(start) ?? { start, earned: 0, spent: 0 };
      week.earned += earned;
      week.spent += spent;
      weeks.set(start, week);
    }
    return { granularity: 'week' as const, points: [...weeks.values()] };
  }

  /** GET /admin/economy/reasons — RF-162. Créditos ganados por cada motivo. */
  reasons(days: number) {
    const { from, to } = this.range(days);
    return this.creditsStats.earnedByReason(from, to);
  }

  /** GET /admin/economy/circulation — RF-164. Créditos en manos de los jugadores al final de cada día. */
  circulation(days: number) {
    const { from, to } = this.range(days);
    return this.creditsStats.circulation(from, to);
  }

  /** GET /admin/economy/items — RF-163. Compras de cada artículo de la tienda (de todos los tiempos). */
  items(locale: Locale) {
    return this.creditsStats.itemPurchases(locale);
  }

  /** GET /admin/economy/badges — RF-165. Cuántos jugadores tienen cada insignia. */
  badges(locale: Locale) {
    return this.breakdown.badgeHolders(locale);
  }
}
