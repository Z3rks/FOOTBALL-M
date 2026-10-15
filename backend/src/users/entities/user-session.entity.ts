import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * USER_SESSION — Modelo de Datos §5.3. Sesión de uso de la app; fuente de DAU/MAU,
 * retención, duración de sesión y pico por hora. Dueño: módulo Users.
 */
@Entity('user_sessions')
@Index(['startedAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  /** La duración de la sesión es lastSeenAt − startedAt. */
  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt: Date;
}
