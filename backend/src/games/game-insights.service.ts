import { Injectable } from '@nestjs/common';
import { Locale, localize } from '../shared/i18n/locale';
import { AppClock } from '../shared/time/app-clock';
import { accuracyOf } from './accuracy';
import { GameInsightsReader, GamePerformance, QuestionDifficulty } from './game-insights.reader';
import { readableAnswer } from './readable-answer';
import { GameInsightsRepository } from './repositories/game-insights.repository';

/** Puntaje máximo de una partida (10 preguntas). */
const MAX_SCORE = 10;

/** Implementación de GameInsightsReader (pantalla Minijuegos del panel administrativo). */
@Injectable()
export class GameInsightsService extends GameInsightsReader {
  constructor(
    private readonly insights: GameInsightsRepository,
    private readonly clock: AppClock,
  ) {
    super();
  }

  async performanceByGame(from: string, to: string, locale: Locale): Promise<GamePerformance[]> {
    const rows = await this.insights.performanceByGame(from, to, this.clock.timeZone);
    return rows.map((r) => ({
      gameId: r.gameId,
      name: localize({ name: r.name, translations: r.translations }, locale).name,
      icon: r.icon,
      completed: r.completed,
      abandoned: r.abandoned,
      accuracy: accuracyOf(r.correct, r.questions),
    }));
  }

  /** Puntajes de 0 a 10; los que nadie sacó salen con 0 partidas. */
  async scoreDistribution(gameId: string, from: string, to: string): Promise<Array<{ score: number; sessions: number }>> {
    const rows = await this.insights.scoreDistribution(gameId, from, to, this.clock.timeZone);
    const max = Math.max(MAX_SCORE, ...rows.map((r) => r.score));
    return Array.from({ length: max + 1 }, (_, score) => ({ score, sessions: rows.find((r) => r.score === score)?.sessions ?? 0 }));
  }

  /** Preguntas con menos aciertos, con el texto en el idioma del administrador. */
  async hardestQuestions(from: string, to: string, limit: number, minAnswers: number, locale: Locale): Promise<QuestionDifficulty[]> {
    const rows = await this.insights.hardestQuestions(from, to, this.clock.timeZone, limit, minAnswers);
    return rows.map((r) => {
      const question = localize(r.question, locale);
      return {
        questionId: r.question.id,
        gameId: r.gameId,
        gameName: localize({ name: r.gameName, translations: r.gameTranslations }, locale).name,
        statement: question.statement,
        answer: readableAnswer(question.correctAnswer),
        answers: r.answers,
        correctRate: Math.round((r.correct / r.answers) * 1000) / 10,
      };
    });
  }

  dailyChallengePlayers(from: string, to: string): Promise<Array<{ date: string; players: number }>> {
    return this.insights.dailyChallengePlayers(from, to, this.clock.timeZone);
  }

  sessionsByLocale(from: string, to: string): Promise<Array<{ locale: string; sessions: number }>> {
    return this.insights.sessionsByLocale(from, to, this.clock.timeZone);
  }
}
