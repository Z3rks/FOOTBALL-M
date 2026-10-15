import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuthTokenType {
  REFRESH = 'refresh',
  PASSWORD_RESET = 'password_reset',
}

/**
 * AUTH_TOKEN — Modelo de Datos §5.2. Refresh tokens y tokens de recuperación de
 * contraseña. Solo se guarda el hash, nunca el token en claro. Dueño: módulo Auth.
 */
@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'enum', enum: AuthTokenType, enumName: 'auth_token_type' })
  type: AuthTokenType;

  /** SHA-256 del token. */
  @Column({ name: 'token_hash', type: 'char', length: 64, unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  /** Fecha de revocación (logout) o de uso (password_reset). Con valor, el token ya no es válido. */
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
