import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser, PlayerOnly } from '../auth/decorators';
import { Locale, RequestLocale } from '../shared/i18n/locale';
import { AnswerDto, FinishSessionDto, StartSessionDto } from './dto/games.dto';
import { GameSessionsService } from './game-sessions.service';
import { GamesService } from './games.service';

/** Contrato de API §7 — módulo Games. Solo jugadores: las estadísticas no mezclan partidas de administradores. */
@PlayerOnly()
@Controller('games')
export class GamesController {
  constructor(
    private readonly games: GamesService,
    private readonly sessions: GameSessionsService,
  ) {}

  @Get()
  listCatalog(@RequestLocale() locale: Locale) {
    return this.games.listCatalog(locale);
  }

  @Get('daily-challenge')
  getDailyChallenge(@CurrentUser() user: AuthenticatedUser, @RequestLocale() locale: Locale) {
    return this.games.getDailyChallengeFor(user.id, locale);
  }

  @Post(':id/sessions')
  startSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) gameId: string,
    @Body() dto: StartSessionDto,
    @RequestLocale() locale: Locale,
  ) {
    return this.sessions.start(user.id, gameId, dto.dailyChallenge, locale);
  }

  @Post('sessions/:sessionId/answers')
  answer(@CurrentUser() user: AuthenticatedUser, @Param('sessionId', ParseUUIDPipe) sessionId: string, @Body() dto: AnswerDto) {
    return this.sessions.answer(user.id, sessionId, dto.questionNumber, dto.answer);
  }

  @Patch('sessions/:sessionId')
  finish(@CurrentUser() user: AuthenticatedUser, @Param('sessionId', ParseUUIDPipe) sessionId: string, @Body() dto: FinishSessionDto) {
    return this.sessions.finish(user.id, sessionId, dto.status);
  }

  @Get('sessions/:sessionId')
  getResult(@CurrentUser() user: AuthenticatedUser, @Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.sessions.getResult(user.id, sessionId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sessions/:sessionId/share')
  share(@CurrentUser() user: AuthenticatedUser, @Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.sessions.share(user.id, sessionId);
  }
}
