import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { GamesModule } from '../games/games.module';
import { UsersModule } from '../users/users.module';
import { AdminAnalyticsController } from './analytics/admin-analytics.controller';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminEconomyController } from './economy/admin-economy.controller';
import { AdminGamesController } from './games-insights/admin-games.controller';
import { AdminReportsController } from './reports/admin-reports.controller';
import { AdminUsersController } from './users-management/admin-users.controller';
import { AdminAnalyticsService } from './analytics/admin-analytics.service';
import { AdminAuditModule } from './audit/admin-audit.module';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminEconomyService } from './economy/admin-economy.service';
import { AdminGamesService } from './games-insights/admin-games.service';
import { AdminReportsService } from './reports/admin-reports.service';
import { CsvReportExportService } from './reports/csv-report-export.service';
import { IReportExport } from './reports/report-export';
import { AdminUsersService } from './users-management/admin-users.service';
import { IUserManagement } from './users-management/user-management';

/**
 * Panel administrativo (Contrato de API §9). Solo role=admin. Consulta a Users, Games y Credits a
 * través de sus servicios públicos de estadísticas y audita cada acción en ADMIN_AUDIT_LOG.
 */
@Module({
  imports: [UsersModule, GamesModule, CreditsModule, AdminAuditModule],
  controllers: [AdminDashboardController, AdminUsersController, AdminAnalyticsController, AdminReportsController, AdminGamesController, AdminEconomyController],
  providers: [
    AdminDashboardService,
    AdminAnalyticsService,
    AdminGamesService,
    AdminEconomyService,
    AdminReportsService,
    { provide: IUserManagement, useClass: AdminUsersService },
    { provide: IReportExport, useClass: CsvReportExportService },
  ],
})
export class AdminModule {}
