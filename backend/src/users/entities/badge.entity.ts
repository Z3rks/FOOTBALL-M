import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Translations } from '../../shared/i18n/locale';

/** Códigos fijos con los que el código otorga cada insignia (el nombre visible puede cambiar). */
export enum BadgeCode {
  FIRST_GAME = 'first-game',
  STREAK_7 = 'streak-7',
  PERFECT_GAME = 'perfect-game',
  DAILY_HUNTER = 'daily-hunter',
  ALL_ROUNDER = 'all-rounder',
  COLLECTOR = 'collector',
  LEGEND = 'legend',
}

/** BADGE — Modelo de Datos §5.14. Catálogo de insignias. Dueño: módulo Users. */
@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  icon: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  /** Nombre y descripción en otros idiomas (ver shared/i18n/locale.ts); el original está en español. */
  @Column({ type: 'jsonb', nullable: true })
  translations: Translations<Pick<Badge, 'name' | 'description'>> | null;
}
