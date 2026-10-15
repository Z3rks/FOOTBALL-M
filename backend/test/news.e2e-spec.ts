import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource, Like } from 'typeorm';
import { NewsArticle, NewsCategory } from '../src/news/entities/news-article.entity';
import { NewsSyncService } from '../src/news/news-sync.service';
import { ExternalArticle, NewsProvider } from '../src/news/news.provider';
import { createTestApp, deleteE2eUsers, registerPlayer, RUN_ID } from './utils';
import { Locale } from '../src/shared/i18n/locale';

/** Proveedor falso: devuelve lo que la prueba le indique, y puede fallar en una categoría. */
class FakeNewsProvider extends NewsProvider {
  readonly name = 'Fake';
  articles = new Map<NewsCategory, ExternalArticle[]>();
  failing = new Set<NewsCategory>();
  /** Las noticias de prueba son en inglés; en español el proveedor no trae nada. */
  async fetchLatest(category: NewsCategory, language: Locale): Promise<ExternalArticle[]> {
    if (this.failing.has(category)) throw new Error('proveedor caído');
    return language === 'en' ? (this.articles.get(category) ?? []) : [];
  }
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
const external = (n: number, publishedAt: Date, title = `Noticia ${n}`): ExternalArticle => ({
  externalId: `e2e:${RUN_ID}:${n}`,
  title,
  description: `Descripción ${n}`,
  source: 'BBC Sport',
  sourceUrl: `https://example.com/e2e/${RUN_ID}/${n}`,
  imageUrl: null,
  publishedAt,
});

/** Pruebas e2e del módulo News contra PostgreSQL real, con un proveedor falso en lugar de Currents. */
describe('News (e2e)', () => {
  let app: NestExpressApplication;
  let db: DataSource;
  let auth: string;
  const provider = new FakeNewsProvider();
  const api = () => request(app.getHttpServer());
  const news = (query = '') => api().get(`/v1/news${query}`).set('Authorization', auth);
  type ArticleView = { id: string; title: string; category: string; sourceUrl: string; publishedAt: string };
  /** Solo las noticias creadas por esta ejecución (la base de desarrollo puede tener otras). */
  const ours = (items: ArticleView[]) => items.filter((a) => a.sourceUrl.includes(`/e2e/${RUN_ID}/`));

  beforeAll(async () => {
    ({ app, db } = await createTestApp((builder) => builder.overrideProvider(NewsProvider).useValue(provider)));
    auth = (await registerPlayer(app, 'lector')).auth;

    provider.articles.set(NewsCategory.TRANSFERS, [external(1, hoursAgo(5)), external(2, hoursAgo(1))]);
    provider.articles.set(NewsCategory.PREMIER_LEAGUE, [external(3, hoursAgo(3))]);
    provider.articles.set(NewsCategory.CHAMPIONS_LEAGUE, [external(4, hoursAgo(40 * 24))]); // más vieja que la retención
    provider.failing.add(NewsCategory.WORLD_CUP);
  });

  afterAll(async () => {
    await db.getRepository(NewsArticle).delete({ externalId: Like(`e2e:${RUN_ID}:%`) });
    await deleteE2eUsers(db);
    await app.close();
  });

  describe('sincronización', () => {
    it('guarda las noticias de cada categoría aunque otra categoría falle', async () => {
      const summary = await app.get(NewsSyncService).syncAll();
      expect(summary.failed).toEqual([
        { category: NewsCategory.WORLD_CUP, language: 'en' },
        { category: NewsCategory.WORLD_CUP, language: 'es' },
      ]);
      expect(await db.getRepository(NewsArticle).countBy({ externalId: Like(`e2e:${RUN_ID}:%`) })).toBe(3);
    });

    it('borra las noticias de más de 30 días', async () => {
      expect(await db.getRepository(NewsArticle).findOneBy({ externalId: `e2e:${RUN_ID}:4` })).toBeNull();
    });

    it('sincronizar de nuevo actualiza sin duplicar y conserva la categoría original', async () => {
      // La noticia 1 aparece ahora también en Premier League, con otro título.
      provider.articles.set(NewsCategory.PREMIER_LEAGUE, [external(3, hoursAgo(3)), external(1, hoursAgo(5), 'Título actualizado')]);
      await app.get(NewsSyncService).syncAll();

      const updated = await db.getRepository(NewsArticle).findOneByOrFail({ externalId: `e2e:${RUN_ID}:1` });
      expect(updated).toMatchObject({ title: 'Título actualizado', category: NewsCategory.TRANSFERS });
      expect(await db.getRepository(NewsArticle).countBy({ externalId: Like(`e2e:${RUN_ID}:%`) })).toBe(3);
    });
  });

  describe('feed', () => {
    it('TC-60: muestra solo las noticias del idioma pedido', async () => {
      expect(ours((await news('?limit=100').expect(200)).body.data)).toHaveLength(3);
      const es = await news('?limit=100').set('Accept-Language', 'es').expect(200);
      expect(ours(es.body.data)).toHaveLength(0); // las noticias de prueba son en inglés
    });

    it('RF-072: lista de la más reciente a la más antigua, sin datos internos', async () => {
      const res = await news('?limit=100').expect(200);
      const dates = res.body.data.map((a: { publishedAt: string }) => new Date(a.publishedAt).getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
      expect(ours(res.body.data).map((a: { title: string }) => a.title)).toEqual(['Noticia 2', 'Noticia 3', 'Título actualizado']);
      expect(ours(res.body.data)[0]).toEqual({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        category: expect.any(String),
        source: expect.any(String),
        sourceUrl: expect.any(String),
        imageUrl: null,
        publishedAt: expect.any(String),
      });
    });

    it('TC-13: filtra por categoría; "All" o sin categoría muestra todas', async () => {
      const transfers = (await news(`?category=Transfers&limit=100`).expect(200)).body.data;
      expect(transfers.every((a: { category: string }) => a.category === 'Transfers')).toBe(true);
      expect(ours(transfers)).toHaveLength(2);
      expect(ours((await news('?category=All&limit=100').expect(200)).body.data)).toHaveLength(3);
    });

    it('rechaza una categoría que no existe', () => news('?category=Ligue%201').expect(400));

    it('pagina con ?page= y ?limit=', async () => {
      const res = await news('?page=1&limit=2').expect(200);
      expect(res.body).toMatchObject({ page: 1, limit: 2 });
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBeGreaterThanOrEqual(3);
    });

    it('RF-079: GET /news/:id devuelve la noticia con su enlace a la fuente', async () => {
      const [first] = ours((await news('?limit=100')).body.data);
      const res = await api().get(`/v1/news/${first.id}`).set('Authorization', auth).expect(200);
      expect(res.body).toMatchObject({ id: first.id, sourceUrl: first.sourceUrl });
      await api().get('/v1/news/00000000-0000-4000-8000-000000000000').set('Authorization', auth).expect(404);
    });

    it('exige sesión', () => api().get('/v1/news').expect(401));
  });

  describe('noticias repetidas y filtros', () => {
    it('TC-69: la misma noticia de otro medio (mismo título o misma imagen) no se guarda dos veces', async () => {
      const image = `https://example.com/e2e/${RUN_ID}/foto.jpg`;
      provider.articles.set(NewsCategory.LA_LIGA, [
        { ...external(5, hoursAgo(50), 'El Atlético lidera La Liga'), imageUrl: image },
        // Otro medio del mismo grupo: mismo título con otra puntuación y mayúsculas.
        { ...external(6, hoursAgo(49), 'El Atlético lidera LA LIGA!'), source: 'otro-medio.es' },
        // Otro titular, pero la misma foto: es la misma noticia.
        { ...external(7, hoursAgo(48), 'Atlético, líder de La Liga'), imageUrl: image },
      ]);
      await app.get(NewsSyncService).syncAll();
      await app.get(NewsSyncService).syncAll(); // sincronizar de nuevo tampoco las agrega

      const saved = await db.getRepository(NewsArticle).findBy({ externalId: Like(`e2e:${RUN_ID}:%`), category: NewsCategory.LA_LIGA });
      expect(saved.map((a) => a.externalId)).toEqual([`e2e:${RUN_ID}:5`]);
    });

    it('RF-176: filtra por las ligas nuevas', async () => {
      const laLiga = (await news('?category=La%20Liga&limit=100').expect(200)).body.data;
      expect(ours(laLiga).map((a: ArticleView) => a.title)).toEqual(['El Atlético lidera La Liga']);
      await news('?category=Copa%20Libertadores').expect(200);
    });

    it('TC-70 / RF-177: busca en el título y la descripción, sin distinguir mayúsculas', async () => {
      const byTitle = (await news('?search=NOTICIA%202&limit=100').expect(200)).body.data;
      expect(ours(byTitle).map((a: ArticleView) => a.title)).toEqual(['Noticia 2']);
      const byDescription = (await news('?search=descripci%C3%B3n%203&limit=100').expect(200)).body.data;
      expect(ours(byDescription).map((a: ArticleView) => a.title)).toEqual(['Noticia 3']);
      // "%" y "_" se buscan como texto, no como comodines.
      expect(ours((await news('?search=%25&limit=100').expect(200)).body.data)).toHaveLength(0);
      await news(`?search=${'a'.repeat(101)}`).expect(400);
    });

    it('TC-70 / RF-178: ?days= deja solo las noticias de ese período', async () => {
      const lastDay = ours((await news('?days=1&limit=100').expect(200)).body.data);
      expect(lastDay.map((a: ArticleView) => a.title)).toEqual(['Noticia 2', 'Noticia 3', 'Título actualizado']); // la de hace 50 h no
      const lastThreeDays = ours((await news('?days=3&limit=100').expect(200)).body.data);
      expect(lastThreeDays).toHaveLength(4);
      await news('?days=2').expect(400);
    });
  });
});
