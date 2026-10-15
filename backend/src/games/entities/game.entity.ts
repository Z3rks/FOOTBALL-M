import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Translations } from '../../shared/i18n/locale';
import { GameCategory, GameDifficulty } from '../enums';

/** GAME — Modelo de Datos §5.4. Catálogo de los 10 minijuegos. Dueño: módulo Games. */
@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'enum', enum: GameCategory, enumName: 'game_category' })
  category: GameCategory;

  @Column({ type: 'enum', enum: GameDifficulty, enumName: 'game_difficulty' })
  difficulty: GameDifficulty;

  @Column({ type: 'varchar', length: 20 })
  icon: string;

  /** Clave con la que GameFactory elige la estrategia de validación y puntaje. */
  @Column({ name: 'strategy_key', type: 'varchar', length: 50, unique: true })
  strategyKey: string;

  /** Posición en el catálogo de MinigamesScreen (1 = primero). */
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  /** Textos en otros idiomas (ver shared/i18n/locale.ts). */
  @Column({ type: 'jsonb', nullable: true })
  translations: Translations<Pick<Game, 'name' | 'description'>> | null;
}
