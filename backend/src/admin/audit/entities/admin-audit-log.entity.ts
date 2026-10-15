import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../../users/entities/user.entity';

/**
 * ADMIN_AUDIT_LOG — Modelo de Datos §5.16. Registro de inicios de sesión y acciones de
 * administradores (RNF-SEC-04). Dueño: módulo Admin.
 */
@Entity('admin_audit_logs')
@Index(['createdAt'])
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_user_id', type: 'uuid' })
  adminUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser?: User;

  /** Ej. "Admin login", "Suspend user", "Delete user", "Export report". */
  @Column({ type: 'varchar', length: 100 })
  action: string;

  /** Usuario afectado. Sin FK para conservar el registro aunque el usuario se elimine. */
  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId: string | null;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
