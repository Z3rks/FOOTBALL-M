import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, Locale, localize } from '../shared/i18n/locale';
import { BadgeCode } from './entities/badge.entity';
import { BadgesRepository, BadgeWithProgress } from './repositories/badges.repository';

/** Insignias del jugador (RF-105). */
@Injectable()
export class BadgesService {
  constructor(private readonly badges: BadgesRepository) {}

  /** Todo el catálogo en el idioma pedido, con la fecha en que el jugador ganó cada una (null si todavía no). */
  async listForUser(userId: string, locale: Locale = DEFAULT_LOCALE): Promise<BadgeWithProgress[]> {
    return (await this.badges.listForUser(userId)).map((badge) => {
      const { code, name, icon, description, earnedAt } = localize(badge, locale);
      return { code, name, icon, description, earnedAt };
    });
  }

  countEarned(userId: string): Promise<number> {
    return this.badges.countEarned(userId);
  }

  /** Otorga las insignias indicadas; las que ya tenía se ignoran. Devuelve solo las nuevas. */
  award(userId: string, codes: BadgeCode[]): Promise<string[]> {
    return this.badges.award(userId, codes);
  }
}
