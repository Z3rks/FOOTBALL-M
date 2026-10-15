import { Badge } from '../entities/badge.entity';
import { BadgeCode } from '../entities/badge.entity';

export interface BadgeWithProgress {
  code: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: Date | null;
}

/** Insignia como la guarda el repositorio, con sus traducciones. */
export type StoredBadgeWithProgress = BadgeWithProgress & { translations: Badge['translations'] };

/** Repositorio de BADGE y USER_BADGE. */
export abstract class BadgesRepository {
  /** Todo el catálogo, con la fecha en que el jugador ganó cada una; primero las ganadas. */
  abstract listForUser(userId: string): Promise<StoredBadgeWithProgress[]>;
  abstract countEarned(userId: string): Promise<number>;
  /** Otorga las insignias; las que ya tenía se ignoran. Devuelve los ids de las nuevas. */
  abstract award(userId: string, codes: BadgeCode[]): Promise<string[]>;
}
