import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../auth/decorators';
import { Locale, RequestLocale } from '../../shared/i18n/locale';
import { UserRole } from '../../users/user.enums';
import { AdminDashboardService } from './admin-dashboard.service';

/** Contrato de API §9.1 — AdminDashboardScreen. */
@Roles(UserRole.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboard.summary();
  }

  @Get('dau')
  dau() {
    return this.dashboard.dailyActiveUsers();
  }

  @Get('ranking')
  ranking(@RequestLocale() locale: Locale) {
    return this.dashboard.ranking(locale);
  }

  @Get('trends')
  trends() {
    return this.dashboard.trends();
  }
}
