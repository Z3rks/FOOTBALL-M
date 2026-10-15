import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Locale } from '../../shared/i18n/locale';

/** Categorías de NewsScreen (RF-075 y RF-176). "All" es un filtro, no una categoría. */
export enum NewsCategory {
  TRANSFERS = 'Transfers',
  CHAMPIONS_LEAGUE = 'Champions League',
  WORLD_CUP = 'World Cup',
  PREMIER_LEAGUE = 'Premier League',
  LA_LIGA = 'La Liga',
  SERIE_A = 'Serie A',
  BUNDESLIGA = 'Bundesliga',
  LIBERTADORES = 'Copa Libertadores',
}

/** NEWS_ARTICLE — Modelo de Datos §5.10. Noticias sincronizadas de la API externa. Dueño: módulo News. */
@Entity('news_articles')
@Index(['category', 'publishedAt'])
@Index(['language', 'category', 'publishedAt'])
@Index(['language', 'titleKey'])
export class NewsArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Id del artículo en la API externa; evita duplicados al sincronizar. */
  @Column({ name: 'external_id', type: 'varchar', length: 255, unique: true })
  externalId: string;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  /** titleKey(title) de news-dedup.ts: detecta la misma noticia publicada por varios medios (RF-179). */
  @Column({ name: 'title_key', type: 'varchar', length: 300 })
  titleKey: string;

  @Column({ type: 'text' })
  description: string;

  /** Idioma de la noticia: el feed muestra solo las del idioma del jugador. */
  @Column({ type: 'varchar', length: 5, default: 'en' })
  language: Locale;

  @Column({ type: 'enum', enum: NewsCategory, enumName: 'news_category' })
  category: NewsCategory;

  @Column({ type: 'varchar', length: 100 })
  source: string;

  @Column({ name: 'source_url', type: 'varchar', length: 1000 })
  sourceUrl: string;

  @Column({ name: 'image_url', type: 'varchar', length: 1000, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'published_at', type: 'timestamptz' })
  publishedAt: Date;

  /** Última vez que la sincronización trajo esta noticia: dice cuándo fue la última sincronización. */
  @Column({ name: 'synced_at', type: 'timestamptz', default: () => 'now()' })
  syncedAt: Date;
}
