import { Injectable } from '@nestjs/common';
import { GameInsightsReader } from '../../games/game-insights.reader';
import { Locale } from '../../shared/i18n/locale';
import { AppClock } from '../../shared/time/app-clock';
import { periodRange } from '../period';

/** Preguntas de la lista "más difíciles" y respuestas mínimas para que la tasa de aciertos sea confiable. */
const HARDEST_LIMIT = 10;
const HARDEST_MIN_ANSWERS = 3;

/** AdminGamesScreen (Contrato de API §9.5). Facade sobre GameInsightsReader, por período. */
@Injectable()
export class AdminGamesService {
  constructor(
    private readonly insights: GameInsightsReader,
    private readonly clock: AppClock,
  ) {}

  private range(days: number) {
    return periodRange(this.clock.today(), days);
  }

  /**
   * GET /admin/games/overview — RF-154 a RF-156 y RF-160. Por minijuego: partidas completadas,
   * abandonadas, % de abandono y precisión; y las partidas por idioma.
   */
  async overview(days: number, locale: Locale) {
    const { from, to } = this.range(days);
    const [games, locales] = await Promise.all([this.insights.performanceByGame(from, to, locale), this.insights.sessionsByLocale(from, to)]);
    return {
      games: games.map((g) => {
        const started = g.completed + g.abandoned;
        return { ...g, abandonRate: started ? Math.round((g.abandoned / started) * 1000) / 10 : null };
      }),
      locales,
    };
  }

  /** GET /admin/games/:id/scores — RF-157. Cuántas partidas sacaron cada puntaje. */
  scoreDistribution(gameId: string, days: number) {
    const { from, to } = this.range(days);
    return this.insights.scoreDistribution(gameId, from, to);
  }

  /** GET /admin/games/hardest-questions — RF-158. Las 10 preguntas con menos aciertos (mínimo 3 respuestas). */
  hardestQuestions(days: number, locale: Locale) {
    const { from, to } = this.range(days);
    return this.insights.hardestQuestions(from, to, HARDEST_LIMIT, HARDEST_MIN_ANSWERS, locale);
  }

  /** GET /admin/games/daily-challenge — RF-159. Jugadores que completaron el reto cada día. */
  dailyChallenge(days: number) {
    const { from, to } = this.range(days);
    return this.insights.dailyChallengePlayers(from, to);
  }
}
