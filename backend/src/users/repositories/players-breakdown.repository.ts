import { Badge } from '../entities/badge.entity';

/** Consultas del reparto de los jugadores para el panel administrativo. Solo cuentan los jugadores. */
export abstract class PlayersBreakdownRepository {
  abstract playersByCountry(): Promise<Array<{ country: string | null; players: number }>>;
  /** Jugadores con y sin contraseña y con y sin cuenta de Google. */
  abstract playersByCredentials(): Promise<Array<{ hasPassword: boolean; hasGoogle: boolean; players: number }>>;
  abstract playersByLevel(): Promise<Array<{ level: number; players: number }>>;
  abstract badgeHolders(): Promise<Array<Pick<Badge, 'code' | 'name' | 'icon' | 'translations'> & { players: number }>>;
}
