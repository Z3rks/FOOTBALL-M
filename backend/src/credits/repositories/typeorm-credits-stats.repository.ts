import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { StoreItem } from '../entities/store-item.entity';
import { CreditsStatsRepository } from './credits-stats.repository';

@Injectable()
export class TypeOrmCreditsStatsRepository extends TypeOrmRepository implements CreditsStatsRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async dailyFlow(from: string, to: string, tz: string) {
    const rows: Array<{ day: string; earned: number; spent: number }> = await this.manager.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'earn'), 0)::int AS earned,
              COALESCE(SUM(ABS(t.amount)) FILTER (WHERE t.type = 'spend'), 0)::int AS spent
       FROM generate_series($2::date, $3::date, interval '1 day') AS d
       LEFT JOIN credit_transactions t ON (t.created_at AT TIME ZONE $1)::date = d::date
       GROUP BY d ORDER BY d`,
      [tz, from, to],
    );
    return rows.map((r) => ({ date: r.day, earned: r.earned, spent: r.spent }));
  }

  earnedByReason(from: string, to: string, tz: string): Promise<Array<{ reason: string; credits: number }>> {
    return this.manager.query(
      `SELECT t.reason::text AS reason, SUM(t.amount)::int AS credits
       FROM credit_transactions t
       WHERE t.type = 'earn' AND (t.created_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
       GROUP BY t.reason`,
      [tz, from, to],
    );
  }

  async balanceAtEndOfDay(from: string, to: string, tz: string) {
    // Los gastos se guardan con monto negativo, así que la suma acumulada es el saldo total.
    const rows: Array<{ day: string; credits: number }> = await this.manager.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
              (SELECT COALESCE(SUM(t.amount), 0) FROM credit_transactions t WHERE (t.created_at AT TIME ZONE $1)::date <= d::date)::int AS credits
       FROM generate_series($2::date, $3::date, interval '1 day') AS d
       ORDER BY d`,
      [tz, from, to],
    );
    return rows.map((r) => ({ date: r.day, credits: r.credits }));
  }

  async itemPurchases() {
    const rows: Array<Pick<StoreItem, 'id' | 'name' | 'icon' | 'cost' | 'translations'> & { item_type: StoreItem['itemType']; purchases: number }> = await this.manager.query(
      `SELECT i.id, i.name, i.icon, i.item_type, i.cost, i.translations, COUNT(o.user_id)::int AS purchases
       FROM store_items i LEFT JOIN user_store_items o ON o.item_id = i.id
       GROUP BY i.id ORDER BY purchases DESC, i.cost`,
    );
    return rows.map(({ item_type, ...item }) => ({ ...item, itemType: item_type }));
  }
}
