import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../shared/transformers/numeric.transformer';
import { UserRole, UserStatus } from '../user.enums';

export { UserRole, UserStatus };

/** USER — Modelo de Datos §5.1. Dueño: módulo Users. */
@Entity('users')
@Index(['status', 'createdAt'])
@Check('CHK_users_credits_balance_non_negative', '"credits_balance" >= 0')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /** Nulo si la cuenta se creó solo con Google. Nunca se expone en la API. */
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ name: 'google_id', type: 'varchar', length: 255, unique: true, nullable: true })
  googleId: string | null;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.PLAYER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, enumName: 'user_status', default: UserStatus.ACTIVE })
  status: UserStatus;

  /** Código ISO 3166-1 alfa-2 (ej. "CO"). */
  @Column({ type: 'char', length: 2, nullable: true })
  country: string | null;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ name: 'xp_total', type: 'int', default: 0 })
  xpTotal: number;

  @Column({ name: 'streak_days', type: 'int', default: 0 })
  streakDays: number;

  @Column({ name: 'last_played_on', type: 'date', nullable: true })
  lastPlayedOn: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  accuracy: number;

  @Column({ name: 'credits_balance', type: 'int', default: 0 })
  creditsBalance: number;

  @Column({ name: 'referred_by', type: 'uuid', nullable: true })
  referredById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referred_by' })
  referredBy?: User | null;

  /** Aceptación de la política de tratamiento de datos (Ley 1581 de 2012). */
  @Column({ name: 'consent_accepted_at', type: 'timestamptz' })
  consentAcceptedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
