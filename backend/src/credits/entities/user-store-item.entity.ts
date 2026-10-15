import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StoreItem } from './store-item.entity';

/**
 * USER_STORE_ITEM — Modelo de Datos §5.13. Ítems comprados (N:M). La PK compuesta
 * impide comprar el mismo ítem dos veces. Dueño: módulo Credits.
 */
@Entity('user_store_items')
export class UserStoreItem {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => StoreItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'item_id' })
  item?: StoreItem;

  /** Si está aplicado al perfil (RF-119). Solo uno por tipo de ítem. */
  @Column({ name: 'is_equipped', type: 'boolean', default: false })
  isEquipped: boolean;

  @CreateDateColumn({ name: 'purchased_at', type: 'timestamptz' })
  purchasedAt: Date;
}
