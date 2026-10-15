import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { UserSession } from '../entities/user-session.entity';
import { ActivityRepository } from './activity.repository';

@Injectable()
export class TypeOrmActivityRepository extends TypeOrmRepository implements ActivityRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async extendOpenSession(userId: string, idleMinutes: number): Promise<boolean> {
    const rows = await this.updateReturning<{ id: string }>(
      `UPDATE user_sessions SET last_seen_at = now()
       WHERE id = (
         SELECT id FROM user_sessions
         WHERE user_id = $1 AND last_seen_at > now() - make_interval(mins => $2)
         ORDER BY last_seen_at DESC LIMIT 1
       )
       RETURNING id`,
      [userId, idleMinutes],
    );
    return rows.length > 0;
  }

  async startSession(userId: string, at: Date): Promise<void> {
    await this.manager.getRepository(UserSession).insert({ userId, startedAt: at, lastSeenAt: at });
  }
}
