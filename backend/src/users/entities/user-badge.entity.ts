import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Badge } from './badge.entity';
import { User } from './user.entity';

/** USER_BADGE — Modelo de Datos §5.15. Insignias ganadas (N:M). Dueño: módulo Users. */
@Entity('user_badges')
export class UserBadge {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'badge_id', type: 'uuid' })
  badgeId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Badge, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'badge_id' })
  badge?: Badge;

  @CreateDateColumn({ name: 'earned_at', type: 'timestamptz' })
  earnedAt: Date;
}
