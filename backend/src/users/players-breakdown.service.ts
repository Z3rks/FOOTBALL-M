import { Injectable } from '@nestjs/common';
import { Locale, localize } from '../shared/i18n/locale';
import { PlayersBreakdownReader, SignupMethod } from './players-breakdown.reader';
import { PlayersBreakdownRepository } from './repositories/players-breakdown.repository';

/** Grupos de la distribución de niveles: [etiqueta, nivel mínimo, nivel máximo]. */
export const LEVEL_RANGES: Array<[string, number, number]> = [
  ['1', 1, 1],
  ['2', 2, 2],
  ['3', 3, 3],
  ['4', 4, 4],
  ['5', 5, 5],
  ['6-10', 6, 10],
  ['11-20', 11, 20],
  ['21+', 21, Infinity],
];

/** Implementación de PlayersBreakdownReader: cómo se reparten los jugadores (panel administrativo). */
@Injectable()
export class PlayersBreakdownService extends PlayersBreakdownReader {
  constructor(private readonly breakdown: PlayersBreakdownRepository) {
    super();
  }

  playersByCountry(): Promise<Array<{ country: string | null; players: number }>> {
    return this.breakdown.playersByCountry();
  }

  async playersBySignupMethod(): Promise<Array<{ method: SignupMethod; players: number }>> {
    const rows = await this.breakdown.playersByCredentials();
    const count = (match: (r: { hasPassword: boolean; hasGoogle: boolean }) => boolean) => rows.filter(match).reduce((sum, r) => sum + r.players, 0);
    return [
      { method: 'email', players: count((r) => r.hasPassword && !r.hasGoogle) },
      { method: 'google', players: count((r) => r.hasGoogle && !r.hasPassword) },
      { method: 'both', players: count((r) => r.hasGoogle && r.hasPassword) },
    ];
  }

  async playersByLevel(): Promise<Array<{ range: string; players: number }>> {
    const rows = await this.breakdown.playersByLevel();
    return LEVEL_RANGES.map(([range, min, max]) => ({
      range,
      players: rows.filter((r) => r.level >= min && r.level <= max).reduce((sum, r) => sum + r.players, 0),
    }));
  }

  async badgeHolders(locale: Locale): Promise<Array<{ code: string; name: string; icon: string; players: number }>> {
    const rows = await this.breakdown.badgeHolders();
    return rows.map((badge) => ({ code: badge.code, name: localize(badge, locale).name, icon: badge.icon, players: badge.players }));
  }
}
