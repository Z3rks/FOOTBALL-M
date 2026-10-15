import { Module } from '@nestjs/common';
import { GamesModule } from '../games/games.module';
import { ActivityService } from './activity.service';
import { BadgesService } from './badges.service';
import { CreditBalanceStore } from './credit-balance.store';
import { PlayerDirectory } from './player-directory';
import { PlayerDirectoryService } from './player-directory.service';
import { ProfileService } from './profile.service';
import { ProgressListener } from './progress.listener';
import { ActivityRepository } from './repositories/activity.repository';
import { BadgesRepository } from './repositories/badges.repository';
import { TypeOrmActivityRepository } from './repositories/typeorm-activity.repository';
import { TypeOrmBadgesRepository } from './repositories/typeorm-badges.repository';
import { TypeOrmUsersStatsRepository } from './repositories/typeorm-users-stats.repository';
import { TypeOrmUsersRepository } from './repositories/typeorm-users.repository';
import { UsersStatsRepository } from './repositories/users-stats.repository';
import { UsersRepository } from './repositories/users.repository';
import { UserAccounts } from './user-accounts';
import { ActivityController, UsersController } from './users.controller';
import { UsersStatsReader } from './users-stats.reader';
import { UsersStatsService } from './users-stats.service';
import { PlayersBreakdownReader } from './players-breakdown.reader';
import { PlayersBreakdownService } from './players-breakdown.service';
import { PlayersBreakdownRepository } from './repositories/players-breakdown.repository';
import { TypeOrmPlayersBreakdownRepository } from './repositories/typeorm-players-breakdown.repository';
import { UsersService } from './users.service';

/**
 * Módulo Users: cuentas, perfil, progreso (escucha GameCompletedEvent), insignias y actividad.
 * Solo exporta interfaces pequeñas, una por consumidor: UserAccounts (Auth),
 * CreditBalanceStore (Credits) y, para Admin, PlayerDirectory, UsersStatsReader y
 * PlayersBreakdownReader.
 */
@Module({
  imports: [GamesModule],
  controllers: [UsersController, ActivityController],
  providers: [
    UsersService,
    ProfileService,
    BadgesService,
    ActivityService,
    ProgressListener,
    { provide: UserAccounts, useExisting: UsersService },
    { provide: CreditBalanceStore, useExisting: UsersService },
    { provide: PlayerDirectory, useClass: PlayerDirectoryService },
    { provide: UsersStatsReader, useClass: UsersStatsService },
    { provide: PlayersBreakdownReader, useClass: PlayersBreakdownService },
    { provide: UsersRepository, useClass: TypeOrmUsersRepository },
    { provide: BadgesRepository, useClass: TypeOrmBadgesRepository },
    { provide: ActivityRepository, useClass: TypeOrmActivityRepository },
    { provide: UsersStatsRepository, useClass: TypeOrmUsersStatsRepository },
    { provide: PlayersBreakdownRepository, useClass: TypeOrmPlayersBreakdownRepository },
  ],
  exports: [UserAccounts, CreditBalanceStore, PlayerDirectory, UsersStatsReader, PlayersBreakdownReader],
})
export class UsersModule {}
