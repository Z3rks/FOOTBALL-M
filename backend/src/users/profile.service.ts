import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { compare, hash } from 'bcryptjs';
import { PlayerGameStatsReader } from '../games/player-game-stats.reader';
import { UniqueConstraintError } from '../shared/database/errors';
import { DomainEvents, PasswordChangedEvent } from '../shared/events/domain-events';
import { AppClock } from '../shared/time/app-clock';
import { BadgesService } from './badges.service';
import { UpdateProfileDto } from './dto/users.dto';
import { User, UserRole } from './entities/user.entity';
import { displayedStreak, xpToNextLevel } from './progress';
import { UsersRepository } from './repositories/users.repository';

/** Operaciones del jugador sobre su propia cuenta (Contrato de API §5). */
@Injectable()
export class ProfileService {
  private readonly bcryptCost: number;

  constructor(
    private readonly users: UsersRepository,
    private readonly badges: BadgesService,
    private readonly gameStats: PlayerGameStatsReader,
    private readonly events: EventEmitter2,
    private readonly clock: AppClock,
    config: ConfigService,
  ) {
    this.bcryptCost = Number(config.get('BCRYPT_COST'));
  }

  /** GET /users/me — header de MainHomeScreen (RF-055 a RF-058) y ProfileScreen (RF-104 a RF-106). */
  async getProfile(userId: string) {
    const user = await this.findOrFail(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      country: user.country,
      level: user.level,
      xpTotal: user.xpTotal,
      xpToNextLevel: xpToNextLevel(user.xpTotal),
      streakDays: displayedStreak(user.streakDays, user.lastPlayedOn, this.clock.today()),
      badgesCount: await this.badges.countEarned(user.id),
      hasPassword: user.passwordHash !== null,
      createdAt: user.createdAt,
    };
  }

  /** GET /users/me/stats — "My Stats" (RF-068) y "Performance" (RF-107 a RF-109). */
  async getStats(userId: string) {
    const user = await this.findOrFail(userId);
    const stats = await this.gameStats.getPlayerStats(user.id);
    return {
      accuracy: user.accuracy,
      xpTotal: user.xpTotal,
      gamesPlayed: stats.gamesPlayed,
      badgesCount: await this.badges.countEarned(user.id),
    };
  }

  /** PATCH /users/me — "Edit Profile" (RF-112). */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findOrFail(userId);
    if (dto.username && dto.username.toLowerCase() !== user.username.toLowerCase()) {
      const taken = await this.users.findByUsername(dto.username);
      if (taken) throw new ConflictException('Username already taken');
    }
    try {
      await this.users.update(user.id, {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.country !== undefined && { country: dto.country }),
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new ConflictException('Username already taken');
      throw error;
    }
    return this.getProfile(user.id);
  }

  /**
   * PATCH /users/me/password — "Account Settings" (RF-112). Cierra todas las sesiones:
   * si alguien más tenía acceso a la cuenta, lo pierde.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOrFail(userId);
    if (!user.passwordHash) throw new BadRequestException('This account signs in with Google and has no password');
    // 400 y no 401: la sesión es válida, lo incorrecto es el dato del formulario.
    if (!(await compare(currentPassword, user.passwordHash))) throw new BadRequestException('Current password is incorrect');
    const newHash = await hash(newPassword, this.bcryptCost);
    // Primero se cierran las sesiones: si luego fallara el guardado, nunca queda una contraseña
    // nueva con sesiones viejas abiertas.
    await this.events.emitAsync(DomainEvents.PASSWORD_CHANGED, new PasswordChangedEvent(user.id));
    await this.users.update(user.id, { passwordHash: newHash });
  }

  /**
   * DELETE /users/me — derecho de supresión (Ley 1581, TC-48). Borra la cuenta y, en cascada,
   * sus partidas, créditos, insignias, sesiones y tokens.
   */
  async deleteAccount(userId: string, password?: string): Promise<void> {
    const user = await this.findOrFail(userId);
    // Los administradores tienen registros de auditoría que deben conservarse.
    if (user.role === UserRole.ADMIN) throw new ForbiddenException('Administrator accounts cannot be self-deleted');
    if (user.passwordHash && !(password && (await compare(password, user.passwordHash)))) {
      throw new BadRequestException('Password is required and must be correct');
    }
    await this.users.delete(user.id);
  }

  private async findOrFail(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
