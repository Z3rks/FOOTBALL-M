import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../auth/decorators';
import { Locale, RequestLocale } from '../../shared/i18n/locale';
import { UserRole } from '../../users/user.enums';
import { PeriodQueryDto } from '../period';
import { AdminEconomyService } from './admin-economy.service';

/** Contrato de API §9.6 — AdminEconomyScreen (se abre desde el Panel). */
@Roles(UserRole.ADMIN)
@Controller('admin/economy')
export class AdminEconomyController {
  constructor(private readonly economy: AdminEconomyService) {}

  @Get('flow')
  flow(@Query() query: PeriodQueryDto) {
    return this.economy.flow(query.days);
  }

  @Get('reasons')
  reasons(@Query() query: PeriodQueryDto) {
    return this.economy.reasons(query.days);
  }

  @Get('circulation')
  circulation(@Query() query: PeriodQueryDto) {
    return this.economy.circulation(query.days);
  }

  @Get('items')
  items(@RequestLocale() locale: Locale) {
    return this.economy.items(locale);
  }

  @Get('badges')
  badges(@RequestLocale() locale: Locale) {
    return this.economy.badges(locale);
  }
}
