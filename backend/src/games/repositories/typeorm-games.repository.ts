import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { DailyChallenge } from '../entities/daily-challenge.entity';
import { Game } from '../entities/game.entity';
import { ChallengeWithGame, GamesRepository } from './games.repository';

@Injectable()
export class TypeOrmGamesRepository extends TypeOrmRepository implements GamesRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  private get games() {
    return this.manager.getRepository(Game);
  }

  private get challenges() {
    return this.manager.getRepository(DailyChallenge);
  }

  listCatalog(): Promise<Game[]> {
    return this.games.find({ order: { sortOrder: 'ASC' } });
  }

  findById(id: string): Promise<Game | null> {
    return this.games.findOneBy({ id });
  }

  async countCategories(): Promise<number> {
    const row = await this.games.createQueryBuilder('g').select('COUNT(DISTINCT g.category)', 'n').getRawOne<{ n: string }>();
    return Number(row?.n ?? 0);
  }

  async findChallengeByDate(date: string): Promise<ChallengeWithGame | null> {
    return (await this.challenges.findOne({ where: { challengeDate: date }, relations: { game: true } })) as ChallengeWithGame | null;
  }

  async createChallengeIfMissing(challenge: { challengeDate: string; gameId: string; title: string }): Promise<void> {
    // orIgnore: si dos peticiones lo crean a la vez, gana la primera.
    await this.challenges.createQueryBuilder().insert().values(challenge).orIgnore().execute();
  }
}
