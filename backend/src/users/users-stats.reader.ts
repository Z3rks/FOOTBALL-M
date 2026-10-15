/**
 * Interfaz pública de Users para las métricas del panel administrativo (Facade, Arquitectura §6):
 * registros, actividad de uso y retención. Fechas YYYY-MM-DD en APP_TIMEZONE; los rangos incluyen
 * ambos extremos. Solo cuentan los jugadores. El reparto de los jugadores (país, nivel, método de
 * registro, insignias) está en PlayersBreakdownReader y la fecha de hoy, en AppClock.
 */
export abstract class UsersStatsReader {
  /** Jugadores registrados hasta el final del día indicado. */
  abstract countPlayersUntil(date: string): Promise<number>;
  /** Usuarios activos por día (una sesión cuenta en cada día que abarca). */
  abstract dailyActiveUsers(from: string, to: string): Promise<Array<{ date: string; users: number }>>;
  abstract distinctActiveUsers(from: string, to: string): Promise<number>;
  /** Duración media en minutos, con un decimal. */
  abstract averageSessionMinutes(from: string, to: string): Promise<number>;
  /** Porcentaje de sesiones en cada rango de duración. */
  abstract sessionDurationDistribution(from: string, to: string): Promise<Array<{ range: string; pct: number }>>;
  /** Sesiones iniciadas por hora del día (0-23). */
  abstract sessionsByHour(from: string, to: string): Promise<number[]>;
  /** Retención al día N de una cohorte, en %; null si nadie cumple todavía N días. */
  abstract retention(day: number, cohortFrom: string, cohortTo: string): Promise<number | null>;
  abstract monthlyGrowth(months: number): Promise<Array<{ month: string; newUsers: number; activeUsers: number }>>;
  /** Jugadores registrados cada día del rango (incluidos los días sin registros). */
  abstract signupsByDay(from: string, to: string): Promise<Array<{ date: string; users: number }>>;
  /** Ids de los jugadores registrados en el rango (embudo de activación). */
  abstract playerIdsRegistered(from: string, to: string): Promise<string[]>;
  /** De esos jugadores, cuántos volvieron otro día dentro de los `days` días siguientes a registrarse. */
  abstract countReturnedWithin(userIds: string[], days: number): Promise<number>;
  /** Sesiones iniciadas en el rango por día de la semana (0 = lunes) y hora (0-23). */
  abstract activityHeatmap(from: string, to: string): Promise<Array<{ weekday: number; hour: number; sessions: number }>>;
}
