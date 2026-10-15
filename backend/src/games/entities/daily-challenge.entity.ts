import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Game } from './game.entity';

/** DAILY_CHALLENGE — Modelo de Datos §5.6. Un reto por día. Dueño: módulo Games. */
@Entity('daily_challenges')
export class DailyChallenge {
  @PrimaryColumn({ name: 'challenge_date', type: 'date' })
  challengeDate: string;

  @Column({ name: 'game_id', type: 'uuid' })
  gameId: string;

  @ManyToOne(() => Game, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'game_id' })
  game?: Game;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ name: 'xp_reward', type: 'int', default: 50 })
  xpReward: number;

  @Column({ name: 'credits_reward', type: 'int', default: 50 })
  creditsReward: number;
}
