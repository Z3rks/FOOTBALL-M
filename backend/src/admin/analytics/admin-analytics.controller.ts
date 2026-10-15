import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../auth/decorators';
import { UserRole } from '../../users/user.enums';
import { OptionalPeriodQueryDto, PeriodQueryDto } from '../period';
import { AdminAnalyticsService } from './admin-analytics.service';

/** Contrato de API §9.3 — AdminAnalyticsScreen. */
@Roles(UserRole.ADMIN)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('kpis')
  kpis() {
    return this.analytics.kpis();
  }

  @Get('growth')
  growth() {
    return this.analytics.growth();
  }

  @Get('retention')
  retention() {
    return this.analytics.retention();
  }

  @Get('categories')
  categories(@Query() query: OptionalPeriodQueryDto) {
    return this.analytics.categories(query.days);
  }

  @Get('session-duration')
  sessionDuration(@Query() query: PeriodQueryDto) {
    return this.analytics.sessionDuration(query.days);
  }

  @Get('accuracy-radar')
  accuracyRadar(@Query() query: OptionalPeriodQueryDto) {
    return this.analytics.accuracyRadar(query.days);
  }

  @Get('signups')
  signups(@Query() query: PeriodQueryDto) {
    return this.analytics.signups(query.days);
  }

  @Get('funnel')
  funnel(@Query() query: PeriodQueryDto) {
    return this.analytics.funnel(query.days);
  }

  @Get('countries')
  countries() {
    return this.analytics.countries();
  }

  @Get('signup-methods')
  signupMethods() {
    return this.analytics.signupMethods();
  }

  @Get('levels')
  levels() {
    return this.analytics.levels();
  }

  @Get('heatmap')
  heatmap(@Query() query: PeriodQueryDto) {
    return this.analytics.heatmap(query.days);
  }
}
