import { UserStatus } from './user.enums';

export type PlayerFilter = 'all' | 'active' | 'inactive' | 'new7d';

/** Jugador tal como lo ve el panel administrativo (nunca la entidad ni su contraseña). */
export interface PlayerSummary {
  id: string;
  username: string;
  email: string;
  country: string | null;
  status: UserStatus;
  level: number;
  /** Racha vigente: 0 si pasó más de un día sin jugar. */
  streakDays: number;
  xpTotal: number;
  accuracy: number;
  creditsBalance: number;
  createdAt: Date;
}

/**
 * Interfaz pública de Users para gestionar jugadores desde AdminUsersScreen y los reportes:
 * buscar, consultar, suspender, activar y eliminar. Solo jugadores: las cuentas de
 * administrador no aparecen.
 */
export abstract class PlayerDirectory {
  /** Filtrados, paginados y del más nuevo al más antiguo; búsqueda por nombre o email. */
  abstract searchPlayers(filter: PlayerFilter, search: string | undefined, page: number, limit: number): Promise<{ rows: PlayerSummary[]; total: number }>;
  /** Conteo de cada filtro, con la búsqueda aplicada. */
  abstract countPlayersByFilter(search: string | undefined): Promise<Record<PlayerFilter, number>>;
  abstract findPlayer(id: string): Promise<PlayerSummary | null>;
  abstract findPlayersByIds(ids: string[]): Promise<PlayerSummary[]>;
  /** Insignias ganadas y última actividad registrada (heartbeat). */
  abstract playerActivity(id: string): Promise<{ badgesCount: number; lastActiveAt: Date | null }>;
  abstract setStatus(id: string, status: UserStatus): Promise<void>;
  /** Elimina la cuenta y, en cascada, sus partidas, créditos, insignias, sesiones y tokens. */
  abstract deletePlayer(id: string): Promise<void>;
}
