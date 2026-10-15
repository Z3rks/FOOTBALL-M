import { Injectable } from '@nestjs/common';
import { Locale, localize } from '../shared/i18n/locale';
import { AppClock } from '../shared/time/app-clock';
import { accuracyOf } from './accuracy';
import { GameCategory } from './enums';
import { GamesStatsReader, Trend } from './games-stats.reader';
import { PlayerGameStats, PlayerGameStatsReader } from './player-game-stats.reader';
import { GameSessionsRepository } from './repositories/game-sessions.repository';
import { GamesStatsRepository } from './repositories/games-stats.repository';
import { GamesRepository } from './repositories/games.repository';

/**
 * Implementa dos interfaces públicas de lectura de Games: GamesStatsReader (métricas generales
 * del panel administrativo) y PlayerGameStatsReader (perfil del jugador, para Users). Solo los
 * jugadores pueden jugar (los endpoints de Games son @PlayerOnly), así que todas las partidas
 * son de jugadores.
 */
@Injectable()
export class GamesStatsService implements GamesStatsReader, PlayerGameStatsReader {
  constructor(
    private readonly stats: GamesStatsRepository,
    private readonly sessions: GameSessionsRepository,
    private readonly games: GamesRepository,
    private readonly clock: AppClock,
  ) {}

  private get tz(): string {
    return this.clock.timeZone;
  }

  /** Resumen de las partidas completadas de un jugador (perfil, precisión e insignias). */
  async getPlayerStats(userId: string): Promise<PlayerGameStats> {
    const [stats, categoriesAvailable] = await Promise.all([this.sessions.playerStats(userId), this.games.countCategories()]);
    return { ...stats, categoriesAvailable };
  }

  /** Partidas completadas, aciertos, preguntas y XP en el rango (o de todos los tiempos). */
  async totals(from?: string, to?: string): Promise<{ games: number; correct: number; questions: number; xp: number; accuracy: number | null }> {
    const totals = await this.stats.totals(this.tz, from ?? null, to ?? null);
    return { ...totals, accuracy: accuracyOf(totals.correct, totals.questions) };
  }

  /** Respuestas registradas (incluye partidas sin terminar). "Preguntas respondidas" (RF-147). */
  answersCount(): Promise<number> {
    return this.stats.answersCount();
  }

  /** Máximo de partidas completadas en un solo día, antes del día indicado (para la alerta de récord). */
  maxDailyGamesBefore(date: string): Promise<number> {
    return this.stats.maxDailyGamesBefore(date, this.tz);
  }

  /**
   * Minijuegos más jugados de todos los tiempos (RF-126), con puntaje promedio y tendencia:
   * partidas de los últimos 7 días contra los 7 anteriores.
   */
  async ranking(limit: number, today: string, locale: Locale) {
    const rows = await this.stats.ranking(limit, today, this.tz);
    return rows.map(({ recent, previous, translations, ...game }) => ({
      ...game,
      name: localize({ name: game.name, translations }, locale).name,
      trend: (recent > previous ? 'up' : recent < previous ? 'down' : 'flat') as Trend,
    }));
  }

  /** Partidas y precisión por categoría (las 8, aunque tengan 0), en el rango o de todos los tiempos. */
  async byCategory(from?: string, to?: string): Promise<Array<{ category: GameCategory; games: number; accuracy: number | null }>> {
    const rows = await this.stats.byCategory(this.tz, from ?? null, to ?? null);
    return Object.values(GameCategory).map((category) => {
      const row = rows.find((r) => r.category === category);
      return { category, games: row?.games ?? 0, accuracy: row ? accuracyOf(row.correct, row.questions) : null };
    });
  }

  /** Jugadores con más XP ganada en el rango (RF-150): id, XP y precisión en el rango. */
  async topPlayersByXp(from: string, to: string, limit: number): Promise<Array<{ userId: string; xp: number; accuracy: number | null; games: number }>> {
    const rows = await this.stats.topPlayersByXp(from, to, this.tz, limit);
    return rows.map((r) => ({ userId: r.userId, xp: r.xp, games: r.games, accuracy: accuracyOf(r.correct, r.questions) }));
  }

  /** Partidas completadas, XP y precisión por día en el rango (sirve para agrupar por semana). */
  async dailyGamesAndXp(from: string, to: string): Promise<Array<{ date: string; games: number; xp: number; accuracy: number | null }>> {
    const rows = await this.stats.dailyGamesAndXp(from, to, this.tz);
    return rows.map((r) => ({ date: r.date, games: r.games, xp: r.xp, accuracy: accuracyOf(r.correct, r.questions) }));
  }
}
