import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, localize } from '../shared/i18n/locale';
import { AppClock } from '../shared/time/app-clock';
import { dayNumber } from '../shared/time/app-date';
import { Game } from './entities/game.entity';
import { GameSessionsRepository } from './repositories/game-sessions.repository';
import { ChallengeWithGame, GamesRepository } from './repositories/games.repository';

export const DAILY_CHALLENGE_TITLE = 'Football Trivia Blitz';

/** Datos públicos de un minijuego en el idioma pedido (nunca strategy_key ni preguntas). */
export function toGameSummary(original: Game, locale: Locale) {
  const game = localize(original, locale);
  return { id: game.id, name: game.name, description: game.description, category: game.category, difficulty: game.difficulty, icon: game.icon };
}

/** Catálogo de minijuegos y reto diario (Contrato de API §7). */
@Injectable()
export class GamesService {
  constructor(
    private readonly games: GamesRepository,
    private readonly sessions: GameSessionsRepository,
    private readonly clock: AppClock,
  ) {}

  /** GET /games — RF-063 a RF-066, RF-083 a RF-086. */
  async listCatalog(locale: Locale) {
    return (await this.games.listCatalog()).map((game) => toGameSummary(game, locale));
  }

  async findGameOrFail(gameId: string): Promise<Game> {
    const game = await this.games.findById(gameId);
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  today(): string {
    return this.clock.today();
  }

  /**
   * Reto del día. Se crea la primera vez que alguien lo pide ese día, rotando entre los
   * minijuegos del catálogo; todos los jugadores ven el mismo reto.
   */
  async getOrCreateTodayChallenge(): Promise<ChallengeWithGame> {
    const date = this.today();
    const existing = await this.games.findChallengeByDate(date);
    if (existing) return existing;

    const catalog = await this.games.listCatalog();
    if (catalog.length === 0) throw new NotFoundException('No games available');
    const game = catalog[dayNumber(date) % catalog.length];
    // Si dos peticiones lo crean a la vez, gana la primera y ambas leen el mismo reto.
    await this.games.createChallengeIfMissing({ challengeDate: date, gameId: game.id, title: DAILY_CHALLENGE_TITLE });
    const created = await this.games.findChallengeByDate(date);
    if (!created) throw new NotFoundException('Daily challenge not available');
    return created;
  }

  /** ¿El usuario ya completó el reto de hoy? (el reto da recompensa una sola vez por día). */
  hasCompletedDailyChallengeToday(userId: string): Promise<boolean> {
    return this.sessions.hasCompletedDailyChallengeOn(userId, this.today(), this.clock.timeZone);
  }

  /** GET /games/daily-challenge — RF-059 a RF-062. */
  async getDailyChallengeFor(userId: string, locale: Locale) {
    const challenge = await this.getOrCreateTodayChallenge();
    return {
      date: challenge.challengeDate,
      title: challenge.title,
      game: toGameSummary(challenge.game, locale),
      xpReward: challenge.xpReward,
      creditsReward: challenge.creditsReward,
      completedToday: await this.hasCompletedDailyChallengeToday(userId),
    };
  }
}
