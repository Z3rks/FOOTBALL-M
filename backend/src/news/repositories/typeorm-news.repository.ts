import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, LessThan } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { Locale } from '../../shared/i18n/locale';
import { NewsArticle, NewsCategory } from '../entities/news-article.entity';
import { ArticleToSave, SavedArticleRef } from '../news-dedup';
import { NewsFilters, NewsRepository } from './news.repository';

/** "50%_off" → "50\%\_off": el texto del buscador se busca tal cual, sin comodines de LIKE. */
const escapeLike = (text: string) => text.replace(/[\%_]/g, (c) => `\${c}`);

@Injectable()
export class TypeOrmNewsRepository extends TypeOrmRepository implements NewsRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  private get articles() {
    return this.manager.getRepository(NewsArticle);
  }

  async list(language: Locale, { category, search, since }: NewsFilters, page: number, limit: number) {
    const query = this.articles.createQueryBuilder('n').where('n.language = :language', { language });
    if (category) query.andWhere('n.category = :category', { category });
    if (since) query.andWhere('n.publishedAt >= :since', { since });
    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      query.andWhere(new Brackets((q) => q.where('n.title ILIKE :pattern', { pattern }).orWhere('n.description ILIKE :pattern', { pattern })));
    }
    const [rows, total] = await query
      .orderBy('n.publishedAt', 'DESC')
      .addOrderBy('n.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { rows, total };
  }

  findById(id: string): Promise<NewsArticle | null> {
    return this.articles.findOneBy({ id });
  }

  async findByTitleKeysOrImages(language: Locale, titleKeys: string[], imageUrls: string[]): Promise<SavedArticleRef[]> {
    if (titleKeys.length === 0 && imageUrls.length === 0) return [];
    return this.articles
      .createQueryBuilder('n')
      .select(['n.externalId', 'n.titleKey', 'n.imageUrl'])
      .where('n.language = :language', { language })
      .andWhere(
        new Brackets((q) => {
          q.where('FALSE');
          if (titleKeys.length > 0) q.orWhere('n.titleKey IN (:...titleKeys)', { titleKeys });
          if (imageUrls.length > 0) q.orWhere('n.imageUrl IN (:...imageUrls)', { imageUrls });
        }),
      )
      .getMany();
  }

  async upsertMany(articles: ArticleToSave[], category: NewsCategory, language: Locale): Promise<void> {
    if (articles.length === 0) return;
    await this.articles
      .createQueryBuilder()
      .insert()
      .values(articles.map((article) => ({ ...article, category, language, syncedAt: new Date() })))
      .orUpdate(['title', 'title_key', 'description', 'source', 'source_url', 'image_url', 'published_at', 'synced_at'], ['external_id'])
      .execute();
  }

  async deletePublishedBefore(date: Date): Promise<void> {
    await this.articles.delete({ publishedAt: LessThan(date) });
  }

  async lastSyncedAt(): Promise<Date | null> {
    const row = await this.articles.createQueryBuilder('n').select('MAX(n.syncedAt)', 'last').getRawOne<{ last: Date | null }>();
    return row?.last ? new Date(row.last) : null;
  }
}
