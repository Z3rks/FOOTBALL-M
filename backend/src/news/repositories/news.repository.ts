import { Locale } from '../../shared/i18n/locale';
import { NewsArticle, NewsCategory } from '../entities/news-article.entity';
import { ArticleToSave, SavedArticleRef } from '../news-dedup';

/** Filtros del feed (RF-075 a RF-078 y RF-176 a RF-178). */
export interface NewsFilters {
  /** Sin categoría = todas ("All"). */
  category?: NewsCategory;
  /** Texto que debe aparecer en el título o la descripción (sin distinguir mayúsculas). */
  search?: string;
  /** Solo noticias publicadas desde esta fecha. */
  since?: Date;
}

/** Repositorio de NEWS_ARTICLE. */
export abstract class NewsRepository {
  /** Noticias en `language` que cumplen los filtros, de la más reciente a la más antigua. */
  abstract list(language: Locale, filters: NewsFilters, page: number, limit: number): Promise<{ rows: NewsArticle[]; total: number }>;
  abstract findById(id: string): Promise<NewsArticle | null>;
  /** Noticias ya guardadas en `language` con alguno de esos títulos normalizados o imágenes. */
  abstract findByTitleKeysOrImages(language: Locale, titleKeys: string[], imageUrls: string[]): Promise<SavedArticleRef[]>;
  /**
   * Guarda las noticias de una categoría en un idioma. Si una ya existía (mismo externalId) se
   * actualiza su contenido pero conserva la categoría y el idioma con los que entró.
   */
  abstract upsertMany(articles: ArticleToSave[], category: NewsCategory, language: Locale): Promise<void>;
  abstract deletePublishedBefore(date: Date): Promise<void>;
  /** Cuándo fue la última sincronización (la noticia sincronizada más recientemente); null si no hay noticias. */
  abstract lastSyncedAt(): Promise<Date | null>;
}
