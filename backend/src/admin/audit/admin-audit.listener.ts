import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AdminActionEvent, DomainEvents } from '../../shared/events/domain-events';
import { AuditLogRepository } from './repositories/audit-log.repository';

/** Guarda en ADMIN_AUDIT_LOG cada acción administrativa (RNF-SEC-04, "Access is monitored"). */
@Injectable()
export class AdminAuditListener {
  private readonly logger = new Logger(AdminAuditListener.name);

  constructor(private readonly auditLogs: AuditLogRepository) {}

  // suppressErrors: false → si no se puede auditar, el error llega a quien emitió (emitAsync).
  @OnEvent(DomainEvents.ADMIN_ACTION, { suppressErrors: false })
  async handle(event: AdminActionEvent): Promise<void> {
    await this.auditLogs.insert({
      adminUserId: event.adminUserId,
      action: event.action,
      ipAddress: event.ipAddress,
      targetUserId: event.targetUserId,
      details: event.details,
    });
    this.logger.log(`Auditoría: ${event.action} (admin ${event.adminUserId})`);
  }
}
