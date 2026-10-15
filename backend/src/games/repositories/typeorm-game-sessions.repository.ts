import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { FunFact } from '../entities/fun-fact.entity';
import { GameAnswer } from '../entities/game-answer.entity';
import { GameSession } from '../entities/game-session.entity';
import { Question } from '../entities/question.entity';
import { GameCategory, GameSessionStatus } from '../enums';
import { PlayerGameStats } from '../player-game-stats.reader';
import { CompletedSessionResult, GameSessionsRepository, NewGameAnswer, NewGameSession, SessionWithGame } from './game-sessions.repository';

@Injectable()
export class TypeOrmGameSessionsRepository extends TypeOrmRepository implements GameSessionsRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  private get sessions() {
    return this.manager.getRepository(GameSession);
  }

  private get answers() {
    return this.manager.getRepository(GameAnswer);
  }

  private get questions() {
    return this.manager.getRepository(Question);
  }

  lockPlayer(userId: string): Promise<void> {
    return this.lockKey(`games:player:${userId}`);
  }

  pickRandomQuestions(gameId: string, limit: number): Promise<Question[]> {
    return this.questions.createQueryBuilder('q').where('q.game_id = :gameId', { gameId }).orderBy('RANDOM()').limit(limit).getMany();
  }

  findQuestion(id: string): Promise<Question | null> {
    return this.questions.findOneBy({ id });
  }

  findQuestionsByIds(ids: string[]): Promise<Question[]> {
    return this.questions.findBy({ id: In(ids) });
  }

  create(session: NewGameSession): Promise<GameSession> {
    return this.sessions.save(this.sessions.create(session));
  }

  async findOwned(userId: string, sessionId: string): Promise<SessionWithGame | null> {
    return (await this.sessions.findOne({ where: { id: sessionId, userId }, relations: { game: true } })) as SessionWithGame | null;
  }

  async insertAnswer(answer: NewGameAnswer): Promise<void> {
    await this.translateErrors(() => this.answers.insert(answer));
  }

  countAnswers(sessionId: string): Promise<number> {
    return this.answers.countBy({ sessionId });
  }

  listAnswers(sessionId: string): Promise<GameAnswer[]> {
    return this.answers.find({ where: { sessionId }, order: { questionNumber: 'ASC' } });
  }

  async completeIfInProgress(sessionId: string, result: CompletedSessionResult): Promise<boolean> {
    // Condicional: si dos peticiones completan la misma partida, solo una la cierra.
    const { affected } = await this.sessions.update({ id: sessionId, status: GameSessionStatus.IN_PROGRESS }, { status: GameSessionStatus.COMPLETED, ...result });
    return affected === 1;
  }

  async abandonIfInProgress(sessionId: string): Promise<void> {
    await this.sessions.update({ id: sessionId, status: GameSessionStatus.IN_PROGRESS }, { status: GameSessionStatus.ABANDONED });
  }

  async markSharedIfFirst(sessionId: string): Promise<boolean> {
    const { affected } = await this.sessions.createQueryBuilder().update().set({ sharedAt: () => 'now()' }).where('id = :id AND shared_at IS NULL', { id: sessionId }).execute();
    return affected === 1;
  }

  hasCompletedDailyChallengeOn(userId: string, date: string, tz: string): Promise<boolean> {
    return this.sessions
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.is_daily_challenge = true')
      .andWhere('s.status = :status', { status: GameSessionStatus.COMPLETED })
      .andWhere('(s.completed_at AT TIME ZONE :tz)::date = :day', { tz, day: date })
      .getExists();
  }

  async playerStats(userId: string): Promise<Omit<PlayerGameStats, 'categoriesAvailable'>> {
    const row = await this.sessions
      .createQueryBuilder('s')
      .innerJoin('s.game', 'g')
      .select('COUNT(*)', 'gamesPlayed')
      .addSelect('COALESCE(SUM(s.score), 0)', 'correctAnswers')
      .addSelect('COALESCE(SUM(s.total_questions), 0)', 'answeredQuestions')
      .addSelect('COUNT(*) FILTER (WHERE s.is_daily_challenge)', 'dailyChallengesCompleted')
      .addSelect('COUNT(DISTINCT g.category)', 'categoriesPlayed')
      .where('s.user_id = :userId', { userId })
      .andWhere('s.status = :status', { status: GameSessionStatus.COMPLETED })
      .getRawOne<Record<keyof Omit<PlayerGameStats, 'categoriesAvailable'>, string>>();
    return {
      gamesPlayed: Number(row?.gamesPlayed ?? 0),
      correctAnswers: Number(row?.correctAnswers ?? 0),
      answeredQuestions: Number(row?.answeredQuestions ?? 0),
      dailyChallengesCompleted: Number(row?.dailyChallengesCompleted ?? 0),
      categoriesPlayed: Number(row?.categoriesPlayed ?? 0),
    };
  }

  pickFunFact(category: GameCategory, seed: string): Promise<FunFact | null> {
    return this.manager
      .getRepository(FunFact)
      .createQueryBuilder('f')
      .orderBy('CASE WHEN f.category::text = :category THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('md5(f.id::text || :seed)')
      .setParameters({ category, seed })
      .getOne();
  }
}
