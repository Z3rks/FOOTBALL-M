import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale } from '../shared/i18n/locale';
import { NewsArticle } from './entities/news-article.entity';
import { NewsFilters, NewsRepository } from './repositories/news.repository';

function toView(article: NewsArticle) {
  const { id, title, description, category, source, sourceUrl, imageUrl, publishedAt } = article;
  return { id, title, description, category, source, sourceUrl, imageUrl, publishedAt };
}

/** Feed de noticias (Contrato de API §6). Lee siempre de la base de datos, nunca del proveedor. */
@Injectable()
export class NewsService {
  constructor(private readonly articles: NewsRepository) {}

  /**
   * GET /news — RF-067 a RF-078 y RF-176 a RF-178. Noticias en el idioma del jugador, de la más
   * reciente a la más antigua, filtradas por categoría, texto y antigüedad.
   */
  async list(language: Locale, filters: NewsFilters, page: number, limit: number) {
    const { rows, total } = await this.articles.list(language, filters, page, limit);
    return { data: rows.map(toView), total, page, limit };
  }

  /** GET /news/:id — RF-079 a RF-082 (el frontend abre sourceUrl fuera de la app). */
  async get(id: string) {
    const article = await this.articles.findById(id);
    if (!article) throw new NotFoundException('News article not found');
    return toView(article);
  }
}
