import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Locale } from '../../shared/i18n/locale';
import { numericTransformer } from '../../shared/transformers/numeric.transformer';
import { User } from '../../users/entities/user.entity';
import { GameSessionStatus } from '../enums';
import { Game } from './game.entity';

/** GAME_SESSION — Modelo de Datos §5.7. Una partida; base de ResultsScreen. Dueño: módulo Games. */
@Entity('game_sessions')
@Index(['userId', 'completedAt'])
@Index(['gameId', 'completedAt'])
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'game_id', type: 'uuid' })
  gameId: string;

  @ManyToOne(() => Game, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'game_id' })
  game?: Game;

  @Column({ type: 'enum', enum: GameSessionStatus, enumName: 'game_session_status', default: GameSessionStatus.IN_PROGRESS })
  status: GameSessionStatus;

  /** Idioma en que se juega: las preguntas se muestran y se corrigen en este idioma. */
  @Column({ type: 'varchar', length: 5, default: 'en' })
  locale: Locale;

  @Column({ name: 'is_daily_challenge', type: 'boolean', default: false })
  isDailyChallenge: boolean;

  /** Lo calcula el servidor al completar la partida; nunca se acepta del cliente. */
  @Column({ type: 'int', nullable: true })
  score: number | null;

  @Column({ name: 'total_questions', type: 'int' })
  totalQuestions: number;

  /**
   * Preguntas de la partida en orden: questionIds[0] es la pregunta 1. Se fijan al iniciar,
   * para que el servidor sepa contra qué pregunta validar cada respuesta.
   */
  @Column({ name: 'question_ids', type: 'jsonb' })
  questionIds: string[];

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: numericTransformer })
  accuracy: number | null;

  @Column({ name: 'xp_earned', type: 'int', nullable: true })
  xpEarned: number | null;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  /** Primera vez que se compartió el resultado; los +25 créditos se dan una sola vez (RF-099). */
  @Column({ name: 'shared_at', type: 'timestamptz', nullable: true })
  sharedAt: Date | null;
}
