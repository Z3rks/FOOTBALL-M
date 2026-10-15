import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Roles } from '../../auth/decorators';
import { Locale, RequestLocale } from '../../shared/i18n/locale';
import { UserRole } from '../../users/user.enums';
import { PeriodQueryDto } from '../period';
import { AdminGamesService } from './admin-games.service';

/** Contrato de API §9.5 — AdminGamesScreen (se abre desde el Panel). */
@Roles(UserRole.ADMIN)
@Controller('admin/games')
export class AdminGamesController {
  constructor(private readonly games: AdminGamesService) {}

  @Get('overview')
  overview(@Query() query: PeriodQueryDto, @RequestLocale() locale: Locale) {
    return this.games.overview(query.days, locale);
  }

  @Get('hardest-questions')
  hardestQuestions(@Query() query: PeriodQueryDto, @RequestLocale() locale: Locale) {
    return this.games.hardestQuestions(query.days, locale);
  }

  @Get('daily-challenge')
  dailyChallenge(@Query() query: PeriodQueryDto) {
    return this.games.dailyChallenge(query.days);
  }

  @Get(':id/scores')
  scores(@Param('id', ParseUUIDPipe) id: string, @Query() query: PeriodQueryDto) {
    return this.games.scoreDistribution(id, query.days);
  }
}
