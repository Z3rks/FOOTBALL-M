import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CheckConstraintError, UniqueConstraintError } from '../shared/database/errors';
import { CreditBalanceStore, InsufficientCreditsError } from './credit-balance.store';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';
import { NewUserData, UserAccount, UserAccounts } from './user-accounts';
import { UserRole } from './user.enums';

/** Solo los datos de identidad y acceso; el resto de la entidad no sale del módulo. */
function toAccount(user: User | null): UserAccount | null {
  if (!user) return null;
  const { id, username, email, role, status, passwordHash, googleId } = user;
  return { id, username, email, role, status, passwordHash, googleId };
}

/**
 * Cuentas de usuario. Otros módulos la usan solo a través de interfaces pequeñas:
 * UserAccounts (Auth) y CreditBalanceStore (Credits).
 */
@Injectable()
export class UsersService implements UserAccounts, CreditBalanceStore {
  constructor(private readonly users: UsersRepository) {}

  async findById(id: string): Promise<UserAccount | null> {
    return toAccount(await this.users.findById(id));
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    return toAccount(await this.users.findByEmail(email));
  }

  async findByUsername(username: string): Promise<UserAccount | null> {
    return toAccount(await this.users.findByUsername(username));
  }

  async findByGoogleId(googleId: string): Promise<UserAccount | null> {
    return toAccount(await this.users.findByGoogleId(googleId));
  }

  /** Crea una cuenta de jugador. 409 si el email o el username ya existen. */
  async create(data: NewUserData): Promise<UserAccount> {
    return this.insert(data, UserRole.PLAYER);
  }

  /**
   * Crea una cuenta de administrador. No está en ninguna interfaz pública: la API no permite
   * crear administradores; solo el script de consola admin:create.
   */
  async createAdministrator(data: { username: string; email: string; passwordHash: string }): Promise<UserAccount> {
    return this.insert(data, UserRole.ADMIN);
  }

  async getBalance(userId: string): Promise<number | null> {
    return (await this.users.findById(userId))?.creditsBalance ?? null;
  }

  async addToBalance(userId: string, delta: number): Promise<number> {
    try {
      const balance = await this.users.addCreditsBalance(userId, delta);
      if (balance === null) throw new NotFoundException('User not found');
      return balance;
    } catch (error) {
      // La base de datos impide que el saldo quede negativo.
      if (error instanceof CheckConstraintError) throw new InsufficientCreditsError();
      throw error;
    }
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
    await this.users.update(userId, { googleId });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.users.update(userId, { passwordHash });
  }

  /** Username disponible a partir de un texto base (ej. el nombre de Google): "juan_perez", "juan_perez2"… */
  async generateAvailableUsername(base: string): Promise<string> {
    const clean = base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 24) || 'player';
    const candidate = clean.length >= 3 ? clean : `${clean}player`;
    for (let suffix = 0; suffix < 1000; suffix++) {
      const username = suffix === 0 ? candidate : `${candidate}${suffix + 1}`;
      if (!(await this.users.findByUsername(username))) return username;
    }
    return `${candidate.slice(0, 18)}${Date.now().toString(36)}`;
  }

  private async insert(data: NewUserData, role: UserRole): Promise<UserAccount> {
    try {
      const user = await this.users.create({
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash ?? null,
        googleId: data.googleId ?? null,
        referredById: data.referredById ?? null,
        role,
        consentAcceptedAt: new Date(),
      });
      return toAccount(user)!;
    } catch (error) {
      // Dos registros simultáneos con el mismo email pueden pasar la verificación previa.
      if (error instanceof UniqueConstraintError) throw new ConflictException('Email or username already registered');
      throw error;
    }
  }
}
