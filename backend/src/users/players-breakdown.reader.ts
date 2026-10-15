import { Locale } from '../shared/i18n/locale';

/** Cómo se registró un jugador: solo correo y contraseña, solo Google o los dos. */
export type SignupMethod = 'email' | 'google' | 'both';

/**
 * Interfaz pública de Users para el panel administrativo: cómo se reparten los jugadores (país,
 * método de registro, nivel e insignias). Siempre de todos los tiempos. Solo cuentan los jugadores.
 */
export abstract class PlayersBreakdownReader {
  /** Jugadores por país, de más a menos; country null = sin país. */
  abstract playersByCountry(): Promise<Array<{ country: string | null; players: number }>>;
  /** Los tres métodos de registro, aunque alguno tenga 0 jugadores. */
  abstract playersBySignupMethod(): Promise<Array<{ method: SignupMethod; players: number }>>;
  /** Jugadores por grupo de nivel (1, 2, 3, 4, 5, 6-10, 11-20, 21+). */
  abstract playersByLevel(): Promise<Array<{ range: string; players: number }>>;
  /** Cuántos jugadores tienen cada insignia (todo el catálogo), con el nombre en `locale`. */
  abstract badgeHolders(locale: Locale): Promise<Array<{ code: string; name: string; icon: string; players: number }>>;
}
