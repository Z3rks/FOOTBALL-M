import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { Game } from '../entities/game.entity';
import { Question } from '../entities/question.entity';
import { GameInsightsRepository } from './game-insights.repository';

/** Partidas iniciadas en el rango $2..$3, en la zona $1. */
const STARTED_IN_RANGE = `(s.started_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date`;

@Injectable()
export class TypeOrmGameInsightsRepository extends TypeOrmRepository implements GameInsightsRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async performanceByGame(from: string, to: string, tz: string) {
    const rows: Array<{ game_id: string; name: string; translations: Game['translations']; icon: string; completed: number; abandoned: number; correct: number; questions: number }> =
      await this.manager.query(
        `SELECT g.id AS game_id, g.name, g.translations, g.icon,
                COUNT(s.id) FILTER (WHERE s.status = 'completed')::int AS completed,
                COUNT(s.id) FILTER (WHERE s.status = 'abandoned')::int AS abandoned,
                COALESCE(SUM(s.score) FILTER (WHERE s.status = 'completed'), 0)::int AS correct,
                COALESCE(SUM(s.total_questions) FILTER (WHERE s.status = 'completed'), 0)::int AS questions
         FROM games g
         LEFT JOIN game_sessions s ON s.game_id = g.id AND ${STARTED_IN_RANGE}
         GROUP BY g.id ORDER BY g.sort_order`,
        [tz, from, to],
      );
    return rows.map(({ game_id, ...rest }) => ({ gameId: game_id, ...rest }));
  }

  scoreDistribution(gameId: string, from: string, to: string, tz: string): Promise<Array<{ score: number; sessions: number }>> {
    return this.manager.query(
      `SELECT s.score::int AS score, COUNT(*)::int AS sessions
       FROM game_sessions s
       WHERE s.game_id = $4 AND s.status = 'completed' AND (s.completed_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
       GROUP BY s.score ORDER BY s.score`,
      [tz, from, to, gameId],
    );
  }

  async hardestQuestions(from: string, to: string, tz: string, limit: number, minAnswers: number) {
    const rows: Array<{
      id: string;
      statement: string;
      correct_answer: string;
      translations: Question['translations'];
      game_id: string;
      game_name: string;
      game_translations: Game['translations'];
      answers: number;
      correct: number;
    }> = await this.manager.query(
      `SELECT q.id, q.statement, q.correct_answer, q.translations, g.id AS game_id, g.name AS game_name, g.translations AS game_translations,
              COUNT(a.id)::int AS answers, COUNT(a.id) FILTER (WHERE a.is_correct)::int AS correct
       FROM game_answers a
       JOIN questions q ON q.id = a.question_id
       JOIN games g ON g.id = q.game_id
       WHERE (a.answered_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
       GROUP BY q.id, g.id
       HAVING COUNT(a.id) >= $5
       ORDER BY COUNT(a.id) FILTER (WHERE a.is_correct)::float / COUNT(a.id) ASC, COUNT(a.id) DESC, q.id
       LIMIT $4`,
      [tz, from, to, limit, minAnswers],
    );
    return rows.map((r) => ({
      question: { id: r.id, statement: r.statement, correctAnswer: r.correct_answer, translations: r.translations },
      gameId: r.game_id,
      gameName: r.game_name,
      gameTranslations: r.game_translations,
      answers: r.answers,
      correct: r.correct,
    }));
  }

  async dailyChallengePlayers(from: string, to: string, tz: string) {
    const rows: Array<{ day: string; players: number }> = await this.manager.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(DISTINCT s.user_id)::int AS players
       FROM generate_series($2::date, $3::date, interval '1 day') AS d
       LEFT JOIN game_sessions s ON s.status = 'completed' AND s.is_daily_challenge AND (s.completed_at AT TIME ZONE $1)::date = d::date
       GROUP BY d ORDER BY d`,
      [tz, from, to],
    );
    return rows.map((r) => ({ date: r.day, players: r.players }));
  }

  sessionsByLocale(from: string, to: string, tz: string): Promise<Array<{ locale: string; sessions: number }>> {
    return this.manager.query(
      `SELECT s.locale, COUNT(*)::int AS sessions
       FROM game_sessions s
       WHERE ${STARTED_IN_RANGE}
       GROUP BY s.locale ORDER BY sessions DESC`,
      [tz, from, to],
    );
  }
}
