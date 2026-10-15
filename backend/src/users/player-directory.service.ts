import { Injectable } from '@nestjs/common';
import { AppClock } from '../shared/time/app-clock';
import { User } from './entities/user.entity';
import { PlayerDirectory, PlayerFilter, PlayerSummary } from './player-directory';
import { displayedStreak } from './progress';
import { BadgesRepository } from './repositories/badges.repository';
import { UsersStatsRepository } from './repositories/users-stats.repository';
import { UsersRepository } from './repositories/users.repository';
import { UserStatus } from './user.enums';

/** Implementación de PlayerDirectory: el panel administrativo gestiona jugadores a través de ella. */
@Injectable()
export class PlayerDirectoryService extends PlayerDirectory {

  constructor(
    private readonly stats: UsersStatsRepository,
    private readonly users: UsersRepository,
    private readonly badges: BadgesRepository,
    private readonly clock: AppClock,
  ) {
    super();
  }

  async searchPlayers(filter: PlayerFilter, search: string | undefined, page: number, limit: number) {
    const { rows, total } = await this.stats.searchPlayers(filter, search, page, limit);
    const today = this.clock.today();
    return { rows: rows.map((u) => this.toSummary(u, today)), total };
  }

  countPlayersByFilter(search: string | undefined): Promise<Record<PlayerFilter, number>> {
    return this.stats.countPlayersByFilter(search);
  }

  async findPlayer(id: string): Promise<PlayerSummary | null> {
    const user = await this.stats.findPlayer(id);
    return user ? this.toSummary(user, this.clock.today()) : null;
  }

  async findPlayersByIds(ids: string[]): Promise<PlayerSummary[]> {
    const today = this.clock.today();
    return (await this.stats.findPlayersByIds(ids)).map((u) => this.toSummary(u, today));
  }

  async playerActivity(id: string) {
    const [badgesCount, lastActiveAt] = await Promise.all([this.badges.countEarned(id), this.stats.lastActiveAt(id)]);
    return { badgesCount, lastActiveAt };
  }

  async setStatus(id: string, status: UserStatus): Promise<void> {
    await this.users.update(id, { status });
  }

  async deletePlayer(id: string): Promise<void> {
    await this.users.delete(id);
  }

  private toSummary(user: User, today: string): PlayerSummary {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      country: user.country,
      status: user.status,
      level: user.level,
      streakDays: displayedStreak(user.streakDays, user.lastPlayedOn, today),
      xpTotal: user.xpTotal,
      accuracy: user.accuracy,
      creditsBalance: user.creditsBalance,
      createdAt: user.createdAt,
    };
  }
}
