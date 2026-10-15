import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Translations } from '../../shared/i18n/locale';
import { Game } from './game.entity';

/** QUESTION — Modelo de Datos §5.5. Banco de preguntas de cada minijuego. Dueño: módulo Games. */
@Entity('questions')
@Index(['gameId', 'statement'], { unique: true })
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'game_id', type: 'uuid' })
  gameId: string;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game?: Game;

  @Column({ type: 'text' })
  statement: string;

  /** Opciones de respuesta, si el minijuego es de selección. */
  @Column({ type: 'jsonb', nullable: true })
  options: string[] | null;

  /** Nunca se envía al cliente antes de que responda. */
  @Column({ name: 'correct_answer', type: 'varchar', length: 255 })
  correctAnswer: string;

  @Column({ name: 'media_url', type: 'varchar', length: 500, nullable: true })
  mediaUrl: string | null;

  /**
   * Datos públicos que usa el estilo del minijuego para dibujar la pregunta (pistas, colores
   * del escudo, trayectoria, alineación…). Se envían al cliente: nunca contienen la respuesta.
   */
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  /** Textos en otros idiomas (ver shared/i18n/locale.ts). */
  @Column({ type: 'jsonb', nullable: true })
  translations: Translations<QuestionTexts> | null;
}

/** Campos de una pregunta que cambian con el idioma (la respuesta correcta también: se compara en el idioma de la partida). */
export type QuestionTexts = Pick<Question, 'statement' | 'options' | 'correctAnswer' | 'details'>;
