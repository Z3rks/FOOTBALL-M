import { PlayerFilter } from '../../users/player-directory';
import { UserStatus } from '../../users/user.enums';
import { AdminContext } from '../admin-context';

export interface PlayerListItem {
  id: string;
  username: string;
  email: string;
  country: string | null;
  status: UserStatus;
  level: number;
  streakDays: number;
  xpTotal: number;
  createdAt: Date;
}

export interface PlayerActivity {
  dailyXp: Array<{ date: string; xp: number }>;
  accuracyByCategory: Array<{ category: string; accuracy: number | null }>;
}

export interface PlayerDetail extends PlayerListItem {
  accuracy: number;
  creditsBalance: number;
  gamesPlayed: number;
  badgesCount: number;
  lastActiveAt: Date | null;
}

/**
 * Gestión de jugadores de AdminUsersScreen (Arquitectura §7, segregación de interfaces):
 * consultar, suspender, activar y eliminar. La exportación a CSV está aparte, en IReportExport,
 * para que nadie dependa de métodos que no usa.
 */
export abstract class IUserManagement {
  abstract list(
    filter: PlayerFilter,
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ data: PlayerListItem[]; counts: Record<PlayerFilter, number>; total: number; page: number; limit: number }>;
  abstract detail(userId: string): Promise<PlayerDetail>;
  /** XP ganada cada día de los últimos 30 días y precisión por categoría ("Ver perfil"). */
  abstract activity(userId: string): Promise<PlayerActivity>;
  abstract setStatus(ctx: AdminContext, userId: string, status: UserStatus): Promise<PlayerDetail>;
  abstract delete(ctx: AdminContext, userId: string): Promise<void>;
}
