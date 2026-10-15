import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { Locale, RequestLocale } from '../shared/i18n/locale';
import { NewsCategory } from './entities/news-article.entity';
import { NewsService } from './news.service';

/** Antigüedad máxima que ofrece el filtro de NewsScreen (RF-178): hoy, 3 días o una semana. */
export const NEWS_DAYS = [1, 3, 7] as const;

/** Filtros de GET /news (Contrato de API §6). */
export class ListNewsDto extends PaginationDto {
  /** Una de las 8 categorías o "All" (RF-075, RF-176). */
  @IsOptional()
  @IsIn([...Object.values(NewsCategory), 'All'])
  category?: NewsCategory | 'All';

  /** Texto a buscar en el título o la descripción (RF-177). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** Solo noticias de las últimas 24 horas, 3 días o 7 días (RF-178); sin valor = todas. */
  @IsOptional()
  @Type(() => Number)
  @IsIn(NEWS_DAYS)
  days?: (typeof NEWS_DAYS)[number];
}

/** Contrato de API §6 — módulo News. */
@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  list(@Query() query: ListNewsDto, @RequestLocale() locale: Locale) {
    return this.news.list(
      locale,
      {
        category: query.category === 'All' ? undefined : query.category,
        search: query.search?.trim() || undefined,
        since: query.days ? new Date(Date.now() - query.days * 86_400_000) : undefined,
      },
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.news.get(id);
  }
}
