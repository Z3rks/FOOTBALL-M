import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../../shared/database/typeorm-unit-of-work';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { AuditLogRepository } from './audit-log.repository';

@Injectable()
export class TypeOrmAuditLogRepository extends TypeOrmRepository implements AuditLogRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async insert(entry: { adminUserId: string; action: string; ipAddress: string; targetUserId: string | null; details: string | null }): Promise<void> {
    await this.manager.getRepository(AdminAuditLog).insert(entry);
  }
}
