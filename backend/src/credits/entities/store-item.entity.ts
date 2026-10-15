import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Translations } from '../../shared/i18n/locale';

/** Tipos de ítem que muestra CreditsScreen: Avatar, Badge Frame, Ball Icon y Stadium (fondo). */
export enum StoreItemType {
  AVATAR = 'avatar',
  BADGE_FRAME = 'badge_frame',
  BALL_ICON = 'ball_icon',
  BACKGROUND = 'background',
}

/** STORE_ITEM — Modelo de Datos §5.12. Catálogo de la tienda. Dueño: módulo Credits. */
@Entity('store_items')
export class StoreItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ name: 'item_type', type: 'enum', enum: StoreItemType, enumName: 'store_item_type' })
  itemType: StoreItemType;

  @Column({ type: 'int' })
  cost: number;

  @Column({ type: 'varchar', length: 20 })
  icon: string;

  /** Textos en otros idiomas (ver shared/i18n/locale.ts). */
  @Column({ type: 'jsonb', nullable: true })
  translations: Translations<Pick<StoreItem, 'name'>> | null;
}
