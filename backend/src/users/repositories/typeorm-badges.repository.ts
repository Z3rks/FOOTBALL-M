import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { Badge, BadgeCode } from '../entities/badge.entity';
import { UserBadge } from '../entities/user-badge.entity';
import { BadgesRepository, StoredBadgeWithProgress } from './badges.repository';

@Injectable()
export class TypeOrmBadgesRepository extends TypeOrmRepository implements BadgesRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  listForUser(userId: string): Promise<StoredBadgeWithProgress[]> {
    return this.manager
      .getRepository(Badge)
      .createQueryBuilder('b')
      .leftJoin(UserBadge, 'ub', 'ub.badge_id = b.id AND ub.user_id = :userId', { userId })
      .select(['b.code AS code', 'b.name AS name', 'b.icon AS icon', 'b.description AS description', 'b.translations AS translations', 'ub.earned_at AS "earnedAt"'])
      .orderBy('ub.earned_at', 'ASC', 'NULLS LAST')
      .addOrderBy('b.name', 'ASC')
      .getRawMany<StoredBadgeWithProgress>();
  }

  countEarned(userId: string): Promise<number> {
    return this.manager.getRepository(UserBadge).countBy({ userId });
  }

  async award(userId: string, codes: BadgeCode[]): Promise<string[]> {
    if (codes.length === 0) return [];
    const inserted: Array<{ badge_id: string }> = await this.manager.query(
      `INSERT INTO user_badges (user_id, badge_id)
       SELECT $1, b.id FROM badges b WHERE b.code = ANY($2)
       ON CONFLICT DO NOTHING
       RETURNING badge_id`,
      [userId, codes],
    );
    return inserted.map((row) => row.badge_id);
  }
}
