import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsSyncService } from './news-sync.service';
import { NewsController } from './news.controller';
import { NewsProvider } from './news.provider';
import { NewsService } from './news.service';
import { NewsRepository } from './repositories/news.repository';
import { TypeOrmNewsRepository } from './repositories/typeorm-news.repository';
import { CurrentsNewsProvider } from './providers/currents.provider';
import { SampleNewsProvider } from './providers/sample.provider';

/**
 * Módulo News. Con NEWS_API_KEY usa Currents API; sin clave, noticias de ejemplo, para que el
 * equipo pueda desarrollar sin registrarse.
 */
@Module({
  controllers: [NewsController],
  providers: [
    NewsService,
    NewsSyncService,
    { provide: NewsRepository, useClass: TypeOrmNewsRepository },
    {
      provide: NewsProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('NEWS_API_KEY') ? new CurrentsNewsProvider(config) : new SampleNewsProvider(),
    },
  ],
})
export class NewsModule {}
