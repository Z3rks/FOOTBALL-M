import { ExternalArticle } from './news.provider';

/**
 * Título normalizado para detectar la misma noticia publicada por varios medios (ej. los
 * periódicos de un mismo grupo): minúsculas y solo letras y números. "Mundial sub'20" y
 * "Mundial sub-20" dan la misma clave.
 */
export function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').slice(0, 300);
}

/** Noticia lista para guardar: la del proveedor más su clave de título. */
export type ArticleToSave = ExternalArticle & { titleKey: string };

/** Lo que ya está guardado de una noticia, suficiente para saber si otra es la misma. */
export interface SavedArticleRef {
  externalId: string;
  titleKey: string;
  imageUrl: string | null;
}

/**
 * RF-179: quita las noticias que ya están guardadas con otro id (mismo título normalizado o
 * misma imagen, en el mismo idioma) y las que se repiten dentro de la misma respuesta. Una
 * noticia con el mismo externalId no es repetida: se actualiza.
 */
export function withoutRepeats(articles: ExternalArticle[], saved: SavedArticleRef[]): ArticleToSave[] {
  const takenKeys = new Map(saved.map((n) => [n.titleKey, n.externalId]));
  const takenImages = new Map(saved.filter((n) => n.imageUrl).map((n) => [n.imageUrl as string, n.externalId]));
  const isRepeated = (taken: Map<string, string>, value: string | null, externalId: string) => !!value && taken.has(value) && taken.get(value) !== externalId;

  const fresh: ArticleToSave[] = [];
  for (const article of articles) {
    const key = titleKey(article.title);
    if (isRepeated(takenKeys, key, article.externalId) || isRepeated(takenImages, article.imageUrl, article.externalId)) continue;
    takenKeys.set(key, article.externalId);
    if (article.imageUrl) takenImages.set(article.imageUrl, article.externalId);
    fresh.push({ ...article, titleKey: key });
  }
  return fresh;
}
