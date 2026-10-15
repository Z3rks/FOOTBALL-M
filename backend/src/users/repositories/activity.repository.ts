/** Repositorio de USER_SESSION (actividad de uso). */
export abstract class ActivityRepository {
  /** Extiende la sesión con actividad en los últimos `idleMinutes`. false si no había ninguna. */
  abstract extendOpenSession(userId: string, idleMinutes: number): Promise<boolean>;
  abstract startSession(userId: string, at: Date): Promise<void>;
}
