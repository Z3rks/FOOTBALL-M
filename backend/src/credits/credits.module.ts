import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CreditsController, StoreController } from './credits.controller';
import { CreditsListener } from './credits.listener';
import { CreditsService } from './credits.service';
import { CreditsStatsReader } from './credits-stats.reader';
import { CreditsStatsService } from './credits-stats.service';
import { CreditsStatsRepository } from './repositories/credits-stats.repository';
import { TypeOrmCreditsStatsRepository } from './repositories/typeorm-credits-stats.repository';
import { CreditTransactionsRepository } from './repositories/credit-transactions.repository';
import { StoreRepository } from './repositories/store.repository';
import { TypeOrmCreditTransactionsRepository } from './repositories/typeorm-credit-transactions.repository';
import { TypeOrmStoreRepository } from './repositories/typeorm-store.repository';
import { StoreService } from './store.service';

/**
 * Módulo Credits: saldo, recompensas (por eventos) y tienda. Emite ItemPurchasedEvent.
 * De Users solo usa CreditBalanceStore. Expone CreditsStatsReader para el panel administrativo.
 */
@Module({
  imports: [UsersModule],
  controllers: [CreditsController, StoreController],
  providers: [
    CreditsService,
    StoreService,
    CreditsListener,
    { provide: CreditTransactionsRepository, useClass: TypeOrmCreditTransactionsRepository },
    { provide: StoreRepository, useClass: TypeOrmStoreRepository },
    { provide: CreditsStatsRepository, useClass: TypeOrmCreditsStatsRepository },
    { provide: CreditsStatsReader, useClass: CreditsStatsService },
  ],
  exports: [CreditsStatsReader],
})
export class CreditsModule {}
