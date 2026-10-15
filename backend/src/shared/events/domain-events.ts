/**
 * Eventos de dominio (Documento de Arquitectura §5). Un módulo los emite sin conocer a
 * quién le interesan; los demás módulos los escuchan con @OnEvent(nombre).
 */
export const DomainEvents = {
  USER_REGISTERED: 'user.registered',
  ADMIN_ACTION: 'admin.action',
  GAME_COMPLETED: 'game.completed',
  RESULT_SHARED: 'game.result-shared',
  STREAK_REACHED: 'user.streak-reached',
  PASSWORD_CHANGED: 'user.password-changed',
  ITEM_PURCHASED: 'credits.item-purchased',
  USER_SUSPENDED: 'admin.user-suspended',
} as const;

/** Emitido por Admin al suspender una cuenta. Auth cierra todas sus sesiones. */
export class UserSuspendedEvent {
  constructor(public readonly userId: string) {}
}

/** Emitido por Credits al comprar un artículo de la tienda. Users otorga la insignia "Coleccionista". */
export class ItemPurchasedEvent {
  constructor(
    public readonly userId: string,
    public readonly itemId: string,
  ) {}
}

/** Emitido por Users al llegar a una racha de 7, 14, 21… días. Credits da +100. */
export class StreakReachedEvent {
  constructor(
    public readonly userId: string,
    public readonly streakDays: number,
  ) {}
}

/** Emitido por Users al cambiar la contraseña. Auth cierra todas las sesiones del usuario. */
export class PasswordChangedEvent {
  constructor(public readonly userId: string) {}
}

/**
 * Emitido por Games al completar una partida. Users actualiza XP, nivel, precisión, racha e
 * insignias; Credits da +50 si era el reto diario.
 */
export class GameCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly gameId: string,
    public readonly category: string,
    public readonly score: number,
    public readonly totalQuestions: number,
    public readonly xpEarned: number,
    public readonly isDailyChallenge: boolean,
    public readonly completedAt: Date,
  ) {}
}

/** Emitido por Games la primera vez que se comparte un resultado. Credits da +25. */
export class ResultSharedEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
  ) {}
}

/** Emitido por Auth al crear una cuenta. Credits lo usa para dar +200 al referente. */
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly referredById: string | null,
  ) {}
}

/** Emitido por Auth y Admin. El registro de auditoría lo guarda en ADMIN_AUDIT_LOG (RNF-SEC-04). */
export class AdminActionEvent {
  constructor(
    public readonly adminUserId: string,
    public readonly action: string,
    public readonly ipAddress: string,
    public readonly targetUserId: string | null = null,
    public readonly details: string | null = null,
  ) {}
}
