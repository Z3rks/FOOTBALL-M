import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { PlayersBreakdownRepository } from './players-breakdown.repository';

@Injectable()
export class TypeOrmPlayersBreakdownRepository extends TypeOrmRepository implements PlayersBreakdownRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  playersByCountry(): Promise<Array<{ country: string | null; players: number }>> {
    return this.manager.query(
      `SELECT country, COUNT(*)::int AS players FROM users WHERE role = 'player' GROUP BY country ORDER BY players DESC, country`,
    );
  }

  async playersByCredentials() {
    const rows: Array<{ has_password: boolean; has_google: boolean; players: number }> = await this.manager.query(
      `SELECT password_hash IS NOT NULL AS has_password, google_id IS NOT NULL AS has_google, COUNT(*)::int AS players
       FROM users WHERE role = 'player' GROUP BY 1, 2`,
    );
    return rows.map((r) => ({ hasPassword: r.has_password, hasGoogle: r.has_google, players: r.players }));
  }

  playersByLevel(): Promise<Array<{ level: number; players: number }>> {
    return this.manager.query(`SELECT level, COUNT(*)::int AS players FROM users WHERE role = 'player' GROUP BY level ORDER BY level`);
  }

  badgeHolders() {
    return this.manager.query(
      `SELECT b.code, b.name, b.icon, b.translations, COUNT(u.id)::int AS players
       FROM badges b
       LEFT JOIN user_badges ub ON ub.badge_id = b.id
       LEFT JOIN users u ON u.id = ub.user_id AND u.role = 'player'
       GROUP BY b.id ORDER BY players DESC, b.name`,
    );
  }
}
