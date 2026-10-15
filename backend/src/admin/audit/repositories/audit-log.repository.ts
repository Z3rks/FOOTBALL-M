/** Repositorio de ADMIN_AUDIT_LOG. */
export abstract class AuditLogRepository {
  abstract insert(entry: { adminUserId: string; action: string; ipAddress: string; targetUserId: string | null; details: string | null }): Promise<void>;
}
