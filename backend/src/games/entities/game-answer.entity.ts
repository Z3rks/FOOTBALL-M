import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GameSession } from './game-session.entity';
import { Question } from './question.entity';

/**
 * GAME_ANSWER — Modelo de Datos §5.8. Cada respuesta se guarda al enviarse, para no
 * perder el progreso si se cae la conexión (RNF-DISP-03). Dueño: módulo Games.
 */
@Entity('game_answers')
@Index(['sessionId', 'questionNumber'], { unique: true })
export class GameAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => GameSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session?: GameSession;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question?: Question;

  @Column({ name: 'question_number', type: 'int' })
  questionNumber: number;

  @Column({ name: 'given_answer', type: 'varchar', length: 255 })
  givenAnswer: string;

  /** Lo determina el servidor comparando con Question.correctAnswer. */
  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;

  @CreateDateColumn({ name: 'answered_at', type: 'timestamptz' })
  answeredAt: Date;
}
