import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GamesByPlayerReader } from '../../games/games-by-player.reader';
import { AdminActionEvent, DomainEvents, UserSuspendedEvent } from '../../shared/events/domain-events';
import { PlayerDirectory, PlayerFilter, PlayerSummary } from '../../users/player-directory';
import { UserStatus } from '../../users/user.enums';
import { addDays } from '../../shared/time/app-date';
import { AdminContext } from '../admin-context';
import { IUserManagement, PlayerActivity, PlayerDetail, PlayerListItem } from './user-management';
import { AppClock } from '../../shared/time/app-clock';

/** Fila de la lista de jugadores; la usa también la exportación a CSV. */
export function toPlayerListItem(player: PlayerSummary): PlayerListItem {
  const { id, username, email, country, status, level, streakDays, xpTotal, createdAt } = player;
  return { id, username, email, country, status, level, streakDays, xpTotal, createdAt };
}

/**
 * AdminUsersScreen (Contrato de API §9.2). Solo gestiona jugadores: las cuentas de
 * administrador no aparecen ni se pueden suspender o borrar desde aquí.
 */
@Injectable()
export class AdminUsersService implements IUserManagement {
  constructor(
    private readonly players: PlayerDirectory,
    private readonly gamesByPlayer: GamesByPlayerReader,
    private readonly clock: AppClock,
    private readonly events: EventEmitter2,
  ) {}

  /** GET /admin/users — RF-130 a RF-134: lista, búsqueda, filtros con conteo y paginación. */
  async list(filter: PlayerFilter, search: string | undefined, page: number, limit: number) {
    const [{ rows, total }, counts] = await Promise.all([
      this.players.searchPlayers(filter, search, page, limit),
      this.players.countPlayersByFilter(search),
    ]);
    return { data: rows.map(toPlayerListItem), counts, total, page, limit };
  }

  /** GET /admin/users/:id — RF-134 a RF-136 (panel expandible y "Ver perfil"). */
  async detail(userId: string): Promise<PlayerDetail> {
    const player = await this.findPlayerOrFail(userId);
    const [gamesPlayed, { badgesCount, lastActiveAt }] = await Promise.all([
      this.gamesByPlayer.completedGames(player.id),
      this.players.playerActivity(player.id),
    ]);
    return {
      ...toPlayerListItem(player),
      accuracy: player.accuracy,
      creditsBalance: player.creditsBalance,
      gamesPlayed,
      badgesCount,
      lastActiveAt,
    };
  }

  /** GET /admin/users/:id/activity — RF-174. XP de los últimos 30 días y precisión por categoría del jugador. */
  async activity(userId: string): Promise<PlayerActivity> {
    const player = await this.findPlayerOrFail(userId);
    const today = this.clock.today();
    const [dailyXp, accuracyByCategory] = await Promise.all([
      this.gamesByPlayer.dailyXp(player.id, addDays(today, -29), today),
      this.gamesByPlayer.accuracyByCategory(player.id),
    ]);
    return { dailyXp, accuracyByCategory };
  }

  /** PATCH /admin/users/:id/status — RF-135. Suspender cierra todas las sesiones del usuario. */
  async setStatus(ctx: AdminContext, userId: string, status: UserStatus): Promise<PlayerDetail> {
    const player = await this.findPlayerOrFail(userId);
    if (player.status !== status) {
      // Se audita primero: nunca queda una acción de administrador sin registro.
      await this.audit(ctx, status === UserStatus.INACTIVE ? 'Suspend user' : 'Activate user', player);
      await this.players.setStatus(player.id, status);
      if (status === UserStatus.INACTIVE) await this.events.emitAsync(DomainEvents.USER_SUSPENDED, new UserSuspendedEvent(player.id));
    }
    return this.detail(player.id);
  }

  /** DELETE /admin/users/:id — RF-135. */
  async delete(ctx: AdminContext, userId: string): Promise<void> {
    const player = await this.findPlayerOrFail(userId);
    // Se audita primero. El registro guarda el id y el username, no el email (minimización de datos).
    await this.audit(ctx, 'Delete user', player);
    await this.players.deletePlayer(player.id);
  }

  private async findPlayerOrFail(userId: string): Promise<PlayerSummary> {
    const player = await this.players.findPlayer(userId);
    if (!player) throw new NotFoundException('User not found');
    return player;
  }

  /** Si no se puede auditar, la petición falla (el listener no suprime errores). */
  private async audit(ctx: AdminContext, action: string, target: PlayerSummary): Promise<void> {
    await this.events.emitAsync(DomainEvents.ADMIN_ACTION, new AdminActionEvent(ctx.adminId, action, ctx.ip, target.id, `username=${target.username}`));
  }
}
