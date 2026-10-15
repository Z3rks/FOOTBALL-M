import { Locale } from '../shared/i18n/locale';
import { NewsCategory } from './entities/news-article.entity';

/** Noticia tal como la entrega un proveedor externo, ya normalizada. */
export interface ExternalArticle {
  externalId: string;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: Date;
}

/**
 * Puerto (patrón Adapter, Arquitectura §6): fuente externa de noticias. Cambiar de proveedor
 * (ej. a un plan pago de otro servicio) es escribir otra clase que implemente esto.
 */
export abstract class NewsProvider {
  /** Nombre para los logs. */
  abstract readonly name: string;
  /** Últimas noticias de la categoría escritas en `language`. */
  abstract fetchLatest(category: NewsCategory, language: Locale): Promise<ExternalArticle[]>;
}

/**
 * Plan de Seguridad A03/A10: el frontend abre sourceUrl al tocar la noticia, así que solo se
 * aceptan enlaces http(s). Un "javascript:" u otro esquema se descarta.
 */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const href = url.toString();
    // 1000 = longitud máxima de source_url / image_url en NEWS_ARTICLE.
    return (url.protocol === 'https:' || url.protocol === 'http:') && href.length <= 1000 ? href : null;
  } catch {
    return null;
  }
}
