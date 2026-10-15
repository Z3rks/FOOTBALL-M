import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedUser, CurrentUser, PlayerOnly } from '../auth/decorators';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { CreditsService } from './credits.service';
import { Locale, RequestLocale } from '../shared/i18n/locale';
import { StoreService } from './store.service';

/** Contrato de API §8 — créditos. Solo jugadores. */
@PlayerOnly()
@Controller('credits')
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  @Get('balance')
  getBalance(@CurrentUser() user: AuthenticatedUser) {
    return this.credits.getBalance(user.id);
  }

  @Get('earn-methods')
  listEarnMethods() {
    return this.credits.listEarnMethods();
  }

  @Get('transactions')
  listTransactions(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationDto) {
    return this.credits.listTransactions(user.id, query.page, query.limit);
  }
}

/** Contrato de API §8 — tienda. Solo jugadores. */
@PlayerOnly()
@Controller('store/items')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get()
  listItems(@CurrentUser() user: AuthenticatedUser, @RequestLocale() locale: Locale) {
    return this.store.listItems(user.id, locale);
  }

  /** Plan de Seguridad §7: límite más estricto en compras. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/purchase')
  purchase(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) itemId: string) {
    return this.store.purchase(user.id, itemId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/equip')
  equip(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) itemId: string) {
    return this.store.equip(user.id, itemId);
  }
}
