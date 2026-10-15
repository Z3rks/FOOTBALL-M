import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Locale, LOCALES } from '../shared/i18n/locale';
import { NewsCategory } from './entities/news-article.entity';
import { titleKey, withoutRepeats } from './news-dedup';
import { NewsProvider } from './news.provider';
import { NewsRepository } from './repositories/news.repository';

/** Las noticias más viejas que esto se borran en cada sincronización. */
export const NEWS_RETENTION_DAYS = 30;

export interface SyncSummary {
  provider: string;
  /** Noticias guardadas o actualizadas (sin contar las repetidas de otros medios). */
  saved: number;
  /** Categorías que no se pudieron traer, con su idioma. */
  failed: Array<{ category: NewsCategory; language: Locale }>;
}

/**
 * Trae noticias del proveedor externo y las guarda en NEWS_ARTICLE (Arquitectura §3.3). El
 * feed de la app lee siempre de la base de datos, así que no depende de que el proveedor
 * responda ni gasta su cupo en cada visita. Con el plan gratuito de Currents (250/día),
 * sincronizar las 8 categorías en los 2 idiomas cada 120 minutos usa 192 peticiones al día.
 */
@Injectable()
export class NewsSyncService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(NewsSyncService.name);
  private readonly intervalMinutes: number;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly articles: NewsRepository,
    private readonly provider: NewsProvider,
    config: ConfigService,
  ) {
    this.intervalMinutes = Number(config.get('NEWS_SYNC_MINUTES'));
  }

  async onApplicationBootstrap(): Promise<void> {
    if (this.intervalMinutes <= 0) {
      this.logger.log('Sincronización automática de noticias desactivada (NEWS_SYNC_MINUTES=0)');
      return;
    }
    const wait = await this.millisUntilNextSync();
    this.logger.log(`Noticias: ${this.provider.name}, sincronización cada ${this.intervalMinutes} min; la próxima en ${Math.round(wait / 60_000)} min`);
    // unref: los temporizadores no impiden que el proceso termine.
    this.timer = setTimeout(() => {
      void this.syncAll();
      this.timer = setInterval(() => void this.syncAll(), this.intervalMinutes * 60_000).unref();
    }, wait).unref();
  }

  /**
   * Al arrancar no se sincroniza si la última sincronización fue hace menos de un intervalo: en
   * un servidor que se apaga cuando no tiene visitas (Render gratis), cada arranque gastaría el
   * cupo diario de Currents. Si no se puede saber, se sincroniza ya.
   */
  async millisUntilNextSync(now = Date.now()): Promise<number> {
    const last = await this.articles.lastSyncedAt().catch(() => null);
    return last ? Math.max(0, last.getTime() + this.intervalMinutes * 60_000 - now) : 0;
  }

  onModuleDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  /** Sincroniza las 8 categorías en cada idioma. Si una falla, las demás se guardan igual. */
  async syncAll(): Promise<SyncSummary> {
    const summary: SyncSummary = { provider: this.provider.name, saved: 0, failed: [] };
    if (this.running) return summary; // una sincronización lenta no se solapa con la siguiente
    this.running = true;
    try {
      for (const language of LOCALES) {
        for (const category of Object.values(NewsCategory)) {
          try {
            summary.saved += await this.syncCategory(category, language);
          } catch (error) {
            summary.failed.push({ category, language });
            this.logger.warn(`No se pudieron sincronizar las noticias de "${category}" (${language}): ${(error as Error).message}`);
          }
        }
      }
      await this.articles.deletePublishedBefore(new Date(Date.now() - NEWS_RETENTION_DAYS * 86_400_000));
    } finally {
      this.running = false;
    }
    return summary;
  }

  private async syncCategory(category: NewsCategory, language: Locale): Promise<number> {
    const fetched = await this.provider.fetchLatest(category, language);
    const saved = await this.articles.findByTitleKeysOrImages(
      language,
      fetched.map((a) => titleKey(a.title)),
      fetched.map((a) => a.imageUrl).filter((url): url is string => !!url),
    );
    // RF-179: la misma nota de otro medio no se guarda. Una noticia que ya estaba (mismo
    // externalId) se actualiza y conserva la categoría con la que entró.
    const fresh = withoutRepeats(fetched, saved);
    await this.articles.upsertMany(fresh, category, language);
    return fresh.length;
  }
}
