import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CreditTransactionType {
  EARN = 'earn',
  SPEND = 'spend',
}

/** Los montos de cada motivo viven en el backend (Plan de Seguridad §6). */
export enum CreditReason {
  DAILY_CHALLENGE = 'daily_challenge',
  STREAK_7_DAYS = 'streak_7_days',
  SHARE_RESULT = 'share_result',
  REFERRAL = 'referral',
  PURCHASE = 'purchase',
}

/**
 * CREDIT_TRANSACTION — Modelo de Datos §5.11. Libro contable de créditos; se escribe
 * en la misma transacción que actualiza users.credits_balance. Dueño: módulo Credits.
 */
@Entity('credit_transactions')
@Index(['userId', 'createdAt'])
// Idempotencia: la misma recompensa por el mismo motivo y la misma referencia (partida, ítem,
// usuario referido) solo puede registrarse una vez, aunque el evento llegue dos veces.
@Index('UQ_credit_transactions_reward_once', ['userId', 'reason', 'referenceId'], { unique: true, where: '"reference_id" IS NOT NULL' })
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  /** Positivo al ganar, negativo al gastar. */
  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'enum', enum: CreditTransactionType, enumName: 'credit_transaction_type' })
  type: CreditTransactionType;

  @Column({ type: 'enum', enum: CreditReason, enumName: 'credit_reason' })
  reason: CreditReason;

  /** Registro que originó el movimiento: partida, ítem comprado o usuario referido. */
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
