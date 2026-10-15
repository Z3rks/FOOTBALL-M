import { Module } from '@nestjs/common';
import { GameInsightsReader } from './game-insights.reader';
import { GameInsightsService } from './game-insights.service';
import { GameSessionsService } from './game-sessions.service';
import { GamesByPlayerReader } from './games-by-player.reader';
import { GamesByPlayerService } from './games-by-player.service';
import { GamesStatsReader } from './games-stats.reader';
import { GamesStatsService } from './games-stats.service';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PlayerGameStatsReader } from './player-game-stats.reader';
import { GameInsightsRepository } from './repositories/game-insights.repository';
import { GameSessionsRepository } from './repositories/game-sessions.repository';
import { GamesByPlayerRepository } from './repositories/games-by-player.repository';
import { GamesStatsRepository } from './repositories/games-stats.repository';
import { GamesRepository } from './repositories/games.repository';
import { TypeOrmGameInsightsRepository } from './repositories/typeorm-game-insights.repository';
import { TypeOrmGameSessionsRepository } from './repositories/typeorm-game-sessions.repository';
import { TypeOrmGamesByPlayerRepository } from './repositories/typeorm-games-by-player.repository';
import { TypeOrmGamesStatsRepository } from './repositories/typeorm-games-stats.repository';
import { TypeOrmGamesRepository } from './repositories/typeorm-games.repository';
import { GameFactory } from './strategies/game.factory';

/**
 * Módulo Games: catálogo, reto diario y partidas. Emite GameCompletedEvent y ResultSharedEvent.
 * No depende de ningún otro módulo de dominio. Interfaces públicas: PlayerGameStatsReader (Users)
 * y, para el panel administrativo, GamesStatsReader (métricas generales), GameInsightsReader
 * (pantalla Minijuegos) y GamesByPlayerReader (partidas de un jugador).
 */
@Module({
  controllers: [GamesController],
  providers: [
    GamesService,
    GameSessionsService,
    GameFactory,
    GamesStatsService,
    { provide: PlayerGameStatsReader, useExisting: GamesStatsService },
    { provide: GamesStatsReader, useExisting: GamesStatsService },
    { provide: GameInsightsReader, useClass: GameInsightsService },
    { provide: GamesByPlayerReader, useClass: GamesByPlayerService },
    { provide: GamesRepository, useClass: TypeOrmGamesRepository },
    { provide: GameSessionsRepository, useClass: TypeOrmGameSessionsRepository },
    { provide: GamesStatsRepository, useClass: TypeOrmGamesStatsRepository },
    { provide: GameInsightsRepository, useClass: TypeOrmGameInsightsRepository },
    { provide: GamesByPlayerRepository, useClass: TypeOrmGamesByPlayerRepository },
  ],
  exports: [PlayerGameStatsReader, GamesStatsReader, GameInsightsReader, GamesByPlayerReader],
})
export class GamesModule {}
