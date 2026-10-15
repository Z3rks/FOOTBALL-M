import { User } from '../entities/user.entity';
import { PlayerFilter } from '../player-directory';

/**
 * Consultas de estadísticas sobre USER y USER_SESSION para el panel administrativo. Solo
 * cuentan los jugadores. Las fechas son YYYY-MM-DD en la zona horaria `tz`; los rangos
 * incluyen ambos extremos.
 */
export abstract class UsersStatsRepository {
  abstract searchPlayers(filter: PlayerFilter, search: string | undefined, page: number, limit: number): Promise<{ rows: User[]; total: number }>;
  abstract countPlayersByFilter(search: string | undefined): Promise<Record<PlayerFilter, number>>;
  abstract findPlayer(id: string): Promise<User | null>;
  abstract findPlayersByIds(ids: string[]): Promise<User[]>;
  /** Jugadores registrados hasta el final del día indicado. */
  abstract countPlayersUntil(date: string, tz: string): Promise<number>;
  abstract lastActiveAt(userId: string): Promise<Date | null>;
  /** Usuarios activos por día (una sesión cuenta en cada día que abarca). */
  abstract dailyActiveUsers(from: string, to: string, tz: string): Promise<Array<{ date: string; users: number }>>;
  abstract distinctActiveUsers(from: string, to: string, tz: string): Promise<number>;
  /** Duración media en minutos de las sesiones que empezaron en el rango. */
  abstract averageSessionMinutes(from: string, to: string, tz: string): Promise<number>;
  /**
   * Sesiones que empezaron en el rango, agrupadas por duración: el grupo i tiene las que duran
   * al menos `boundsSeconds[i-1]` y menos que `boundsSeconds[i]` (bounds en orden ascendente).
   */
  abstract sessionCountsByDuration(from: string, to: string, tz: string, boundsSeconds: number[]): Promise<Array<{ bucket: number; sessions: number }>>;
  /** Sesiones iniciadas por hora del día (0-23); las horas sin sesiones no aparecen. */
  abstract sessionsByHour(from: string, to: string, tz: string): Promise<Array<{ hour: number; sessions: number }>>;
  /**
   * De los jugadores registrados entre cohortFrom y cohortTo, cuántos hay (eligible) y cuántos
   * tuvieron actividad `day` o más días después de registrarse (retained).
   */
  abstract retentionCohort(day: number, cohortFrom: string, cohortTo: string, tz: string): Promise<{ eligible: number; retained: number }>;
  /** Jugadores nuevos y activos de cada uno de los últimos `months` meses (YYYY-MM). */
  abstract monthlyGrowth(months: number, tz: string): Promise<Array<{ month: string; newUsers: number; activeUsers: number }>>;
  abstract signupsByDay(from: string, to: string, tz: string): Promise<Array<{ date: string; users: number }>>;
  abstract playerIdsRegistered(from: string, to: string, tz: string): Promise<string[]>;
  /** Jugadores (de `userIds`) con una sesión en un día posterior al registro y a lo sumo `days` días después. */
  abstract countReturnedWithin(userIds: string[], days: number, tz: string): Promise<number>;
  abstract activityHeatmap(from: string, to: string, tz: string): Promise<Array<{ weekday: number; hour: number; sessions: number }>>;
}
