import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Translations } from '../../shared/i18n/locale';
import { GameCategory } from '../enums';

/** FUN_FACT — Modelo de Datos §5.9. Datos curiosos de ResultsScreen. Dueño: módulo Games. */
@Entity('fun_facts')
export class FunFact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  text: string;

  @Column({ type: 'enum', enum: GameCategory, enumName: 'game_category', nullable: true })
  category: GameCategory | null;

  /** Textos en otros idiomas (ver shared/i18n/locale.ts). */
  @Column({ type: 'jsonb', nullable: true })
  translations: Translations<Pick<FunFact, 'text'>> | null;
}
