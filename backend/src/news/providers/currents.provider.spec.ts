import { ConfigService } from '@nestjs/config';
import { NewsCategory } from '../entities/news-article.entity';
import { safeHttpUrl } from '../news.provider';
import { CURRENTS_BASE_URL, CurrentsNewsProvider, isBlockedSource, isRelevant, parseCurrentsDate, sourceNameFromUrl } from './currents.provider';
import { SampleNewsProvider } from './sample.provider';

const article = (overrides: Record<string, unknown> = {}) => ({
  id: 'a1b2',
  title: '  Premier League: Haaland scores again as City plan a January transfer  ',
  description: 'City win 3-0',
  url: 'https://www.bbc.co.uk/sport/football/123',
  author: 'BBC',
  image: 'https://ichef.bbci.co.uk/image.jpg',
  language: 'en',
  category: ['sports'],
  published: '2026-09-24 14:05:00 +0000',
  ...overrides,
});

describe('CurrentsNewsProvider', () => {
  const provider = new CurrentsNewsProvider(new ConfigService({ NEWS_API_KEY: 'clave-secreta' }));
  let fetchMock: jest.SpyInstance;
  const respond = (body: unknown, status = 200) =>
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => fetchMock.mockRestore());

  it('consulta /search con la categoría sports, las palabras clave de la categoría y la clave en el header', async () => {
    respond({ status: 'ok', news: [] });
    await provider.fetchLatest(NewsCategory.PREMIER_LEAGUE, 'en');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(`${parsed.origin}${parsed.pathname}`).toBe(`${CURRENTS_BASE_URL}/search`);
    expect(parsed.searchParams.get('category')).toBe('sports');
    expect(parsed.searchParams.get('keywords')).toBe('Premier League');
    expect(parsed.searchParams.has('query')).toBe(false); // Currents ignora `query`
    expect(parsed.searchParams.get('language')).toBe('en');
    expect((init.headers as Record<string, string>).Authorization).toBe('clave-secreta');
    expect(url).not.toContain('clave-secreta'); // la clave nunca va en la URL (quedaría en logs)
  });

  it('en español busca con palabras clave en español y filtra con términos en español', async () => {
    respond({
      status: 'ok',
      news: [
        article({ id: 'es1', title: 'El Barcelona cierra el fichaje de un delantero', description: 'Contrato hasta 2030' }),
        article({ id: 'es2', title: 'La NBA anuncia su calendario', description: 'Baloncesto y fichajes de verano' }),
        article({ id: 'es3', title: 'Resumen de la jornada', description: 'Sin traspasos a la vista' }),
        article({ id: 'es4', title: 'La ciclista pelea por las medallas en el Mundial', description: 'Tras su fichaje por el equipo' }),
      ],
    });
    const results = await provider.fetchLatest(NewsCategory.TRANSFERS, 'es');
    const params = new URL((fetchMock.mock.calls[0] as [string])[0]).searchParams;
    expect(params.get('language')).toBe('es');
    expect(params.get('keywords')).toBe('fichajes');
    // es2 es de baloncesto; es3 y es4 no tienen ninguna palabra de fútbol.
    expect(results.map((r) => r.externalId)).toEqual(['currents:es1']);
  });

  it('RF-176: las ligas nuevas buscan con sus palabras clave en cada idioma', async () => {
    respond({ status: 'ok', news: [] });
    await provider.fetchLatest(NewsCategory.LA_LIGA, 'es');
    respond({ status: 'ok', news: [] });
    await provider.fetchLatest(NewsCategory.LIBERTADORES, 'en');
    const keywords = fetchMock.mock.calls.map(([url]) => new URL(url as string).searchParams.get('keywords'));
    expect(keywords).toEqual(['LaLiga', 'Copa Libertadores']);
  });

  it('descarta las noticias de medios que no son de fútbol o que solo repiten enlaces', async () => {
    respond({
      status: 'ok',
      news: [
        article({ id: 'foro', url: 'https://www.reddit.com/r/soccer/1', title: 'Premier League: City charged', description: 'submitted by /u/fan' }),
        article({ id: 'ok', url: 'https://www.bbc.co.uk/sport/football/2' }),
      ],
    });
    const results = await provider.fetchLatest(NewsCategory.PREMIER_LEAGUE, 'en');
    expect(results.map((r) => r.externalId)).toEqual(['currents:ok']);
  });

  it('normaliza cada noticia', async () => {
    respond({ status: 'ok', news: [article()] });
    const [result] = await provider.fetchLatest(NewsCategory.PREMIER_LEAGUE, 'en');
    expect(result).toEqual({
      externalId: 'currents:a1b2',
      title: 'Premier League: Haaland scores again as City plan a January transfer',
      description: 'City win 3-0',
      source: 'BBC Sport',
      sourceUrl: 'https://www.bbc.co.uk/sport/football/123',
      imageUrl: 'https://ichef.bbci.co.uk/image.jpg',
      publishedAt: new Date('2026-09-24T14:05:00Z'),
    });
  });

  it('imagen "None" → sin imagen; descripción vacía → texto vacío', async () => {
    respond({ status: 'ok', news: [article({ image: 'None', description: null })] });
    const [result] = await provider.fetchLatest(NewsCategory.TRANSFERS, 'en');
    expect(result.imageUrl).toBeNull();
    expect(result.description).toBe('');
  });

  it('Plan de Seguridad A03: descarta noticias con enlaces que no son http(s)', async () => {
    respond({ status: 'ok', news: [article({ url: 'javascript:alert(1)' }), article({ id: 'ok' })] });
    const results = await provider.fetchLatest(NewsCategory.TRANSFERS, 'en');
    expect(results.map((r) => r.externalId)).toEqual(['currents:ok']);
  });

  it('descarta noticias sin título o con fecha inválida', async () => {
    respond({ status: 'ok', news: [article({ id: 'x', title: ' ' }), article({ id: 'y', published: 'ayer' })] });
    await expect(provider.fetchLatest(NewsCategory.TRANSFERS, 'en')).resolves.toEqual([]);
  });

  it('descarta noticias de otros deportes o de otra categoría', async () => {
    respond({
      status: 'ok',
      news: [
        article({ id: 'nfl', title: 'College football transfer portal: top quarterbacks on the move', description: '' }),
        article({ id: 'tenis', title: 'Tennis star signs new contract', description: 'Singapore Open' }),
        article({ id: 'ok', title: 'Arsenal complete loan deal for Brazilian winger', description: 'The Premier League club confirmed the signing' }),
      ],
    });
    const results = await provider.fetchLatest(NewsCategory.TRANSFERS, 'en');
    expect(results.map((r) => r.externalId)).toEqual(['currents:ok']);
  });

  it('falla con un error claro si la API responde con error (ej. clave inválida o sin cupo)', async () => {
    respond({ status: 'error' }, 401);
    await expect(provider.fetchLatest(NewsCategory.WORLD_CUP, 'en')).rejects.toThrow('Currents API respondió 401');
  });
});

describe('utilidades de noticias', () => {
  it('isRelevant: del tema de la categoría y no de otro deporte', () => {
    expect(isRelevant(NewsCategory.CHAMPIONS_LEAGUE, 'Real Madrid beat Bayern in the Champions League', '')).toBe(true);
    expect(isRelevant(NewsCategory.PREMIER_LEAGUE, 'Real Madrid beat Bayern in the Champions League', '')).toBe(false);
    expect(isRelevant(NewsCategory.WORLD_CUP, 'FIFA confirms World Cup 2030 venues', '')).toBe(true);
    expect(isRelevant(NewsCategory.WORLD_CUP, 'Rugby World Cup: All Blacks win', '')).toBe(false);
    expect(isRelevant(NewsCategory.TRANSFERS, 'Football gossip: Olmo, Bellingham, Alisson', '')).toBe(true);
    expect(isRelevant(NewsCategory.TRANSFERS, 'NFL trade deadline: quarterback moves', 'football')).toBe(false);
    expect(isRelevant(NewsCategory.TRANSFERS, "Chelsea transfer news: Scott move 'discussed'", '')).toBe(true);
    expect(isRelevant(NewsCategory.PREMIER_LEAGUE, 'Premier League Darts 2027 dates and venues revealed', '')).toBe(false);
    expect(isRelevant(NewsCategory.WORLD_CUP, 'Sammy: India series a chance for West Indies to assess ODI progress', 'ahead of the World Cup')).toBe(false);
  });

  it('isRelevant en español: "Mundial" y "fichajes" solo cuentan si la noticia es de fútbol', () => {
    const es = (category: NewsCategory, title: string, description = '') => isRelevant(category, title, description, 'es');
    // Noticias reales que se colaban con el filtro anterior.
    expect(es(NewsCategory.WORLD_CUP, 'La etíope Tigst Assefa llega a meta cojeando', 'a las puertas del récord mundial en el Maratón de Berlín')).toBe(false);
    expect(es(NewsCategory.WORLD_CUP, 'McNulty, gregario de Pogacar, se proclama campeón del mundo', 'en un Mundial sin brillo español')).toBe(false);
    expect(es(NewsCategory.WORLD_CUP, 'El Barça desarma al Zamalek y se mete en la final del Mundial de Clubs (29-39)', '')).toBe(false);
    expect(es(NewsCategory.WORLD_CUP, 'Cuba cerró con victoria su paso por la Olimpiada Mundial de Ajedrez', '')).toBe(false);
    expect(es(NewsCategory.TRANSFERS, 'El nuevo Real Madrid de Pedro Martínez: siete fichajes', 'La Euroliga arranca el jueves')).toBe(false);
    // Fútbol: pasa.
    expect(es(NewsCategory.WORLD_CUP, 'España conquista el Mundial sub-20 en los penaltis', '')).toBe(true);
    expect(es(NewsCategory.TRANSFERS, 'Márquez avala el fichaje de Aguirre', 'El entrenador del Valencia CF')).toBe(true);
    // Palabras con tilde al inicio o al final ("árbitro"): \b de JavaScript no las reconoce.
    expect(es(NewsCategory.WORLD_CUP, 'Darío Herrera, al Mundial 2026', 'Será árbitro del torneo')).toBe(true);
    // "la liga" a secas no basta: debe ser la española.
    expect(es(NewsCategory.LA_LIGA, 'Así va la liga colombiana', 'Goles de la fecha')).toBe(false);
    expect(es(NewsCategory.LA_LIGA, 'El Atlético lidera LaLiga', 'Dos goles de Griezmann')).toBe(true);
  });

  it('isBlockedSource: Cricinfo y Reddit no son fuentes de noticias de fútbol', () => {
    expect(isBlockedSource('https://www.espncricinfo.com/story/1')).toBe(true);
    expect(isBlockedSource('https://old.reddit.com/r/soccer/1')).toBe(true);
    expect(isBlockedSource('https://www.espn.com/soccer/story/1')).toBe(false);
  });

  it('parseCurrentsDate interpreta el formato de Currents con zona horaria', () => {
    expect(parseCurrentsDate('2026-09-24 14:05:00 +0000')).toEqual(new Date('2026-09-24T14:05:00Z'));
    expect(parseCurrentsDate('2026-09-24 09:05:00 -0500')).toEqual(new Date('2026-09-24T14:05:00Z'));
    expect(parseCurrentsDate('no es fecha')).toBeNull();
  });

  it('sourceNameFromUrl usa el nombre del medio si lo conoce, si no el dominio', () => {
    expect(sourceNameFromUrl('https://www.skysports.com/football/news/1')).toBe('Sky Sports');
    expect(sourceNameFromUrl('https://sport.espn.com/x')).toBe('ESPN');
    expect(sourceNameFromUrl('https://www.example.org/x')).toBe('example.org');
  });

  it('safeHttpUrl solo acepta http(s)', () => {
    expect(safeHttpUrl('https://bbc.co.uk/a')).toBe('https://bbc.co.uk/a');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,hola')).toBeNull();
    expect(safeHttpUrl(`https://bbc.co.uk/${'a'.repeat(1000)}`)).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
  });

  it.each([
    ['en', 'Sample'],
    ['es', 'Ejemplo'],
  ] as const)('las noticias de ejemplo (%s) están marcadas como ejemplo y cubren las 8 categorías', async (language, source) => {
    const provider = new SampleNewsProvider();
    const all = (await Promise.all(Object.values(NewsCategory).map((c) => provider.fetchLatest(c, language)))).flat();
    expect(all).toHaveLength(10);
    expect(all.every((a) => a.source === source && a.sourceUrl.startsWith('https://example.com/'))).toBe(true);
    for (const category of Object.values(NewsCategory)) expect((await provider.fetchLatest(category, language)).length).toBeGreaterThan(0);
  });

  it('las noticias de ejemplo en español son otras (otro id y otro texto)', async () => {
    const provider = new SampleNewsProvider();
    const [en] = await provider.fetchLatest(NewsCategory.TRANSFERS, 'en');
    const [es] = await provider.fetchLatest(NewsCategory.TRANSFERS, 'es');
    expect(es.externalId).not.toBe(en.externalId);
    expect(es.title).not.toBe(en.title);
  });
});
