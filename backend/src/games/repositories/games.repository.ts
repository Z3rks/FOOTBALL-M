import { DailyChallenge } from '../entities/daily-challenge.entity';
import { Game } from '../entities/game.entity';

export type ChallengeWithGame = DailyChallenge & { game: Game };

/** Repositorio del catálogo de minijuegos (GAME) y del reto diario (DAILY_CHALLENGE). */
export abstract class GamesRepository {
  /** Catálogo en el orden en que se muestra. */
  abstract listCatalog(): Promise<Game[]>;
  abstract findById(id: string): Promise<Game | null>;
  abstract countCategories(): Promise<number>;
  abstract findChallengeByDate(date: string): Promise<ChallengeWithGame | null>;
  /** Crea el reto del día; si otra petición ya lo creó, no hace nada. */
  abstract createChallengeIfMissing(challenge: { challengeDate: string; gameId: string; title: string }): Promise<void>;
}
