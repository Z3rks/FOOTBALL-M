import { Module } from '@nestjs/common';
import { AdminAuditListener } from './admin-audit.listener';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { TypeOrmAuditLogRepository } from './repositories/typeorm-audit-log.repository';

/** Registro de auditoría del panel administrativo: escucha AdminActionEvent (Auth y Admin). */
@Module({
  providers: [AdminAuditListener, { provide: AuditLogRepository, useClass: TypeOrmAuditLogRepository }],
})
export class AdminAuditModule {}
