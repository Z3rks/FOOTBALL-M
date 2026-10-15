import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Locale } from '../../shared/i18n/locale';
import { NewsCategory } from '../entities/news-article.entity';
import { ExternalArticle, NewsProvider, safeHttpUrl } from '../news.provider';

/** Única URL a la que el adapter hace peticiones (Plan de Seguridad A10: sin URLs del usuario). */
export const CURRENTS_BASE_URL = 'https://api.currentsapi.services/v1';
const TIMEOUT_MS = 10_000;
/** Solo noticias recientes: el feed muestra lo de los últimos días. */
const LOOKBACK_DAYS = 3;

/**
 * Palabras clave de Currents para cada categoría de NewsScreen, en cada idioma (parámetro
 * `keywords`; Currents ignora `query` y devolvería deportes al azar). "transfer news" da
 * fichajes de fútbol; solo "transfer" mezcla otros temas.
 */
const CATEGORY_KEYWORDS: Record<Locale, Record<NewsCategory, string>> = {
  en: {
    [NewsCategory.TRANSFERS]: 'transfer news',
    [NewsCategory.CHAMPIONS_LEAGUE]: 'Champions League',
    [NewsCategory.WORLD_CUP]: 'World Cup',
    [NewsCategory.PREMIER_LEAGUE]: 'Premier League',
    [NewsCategory.LA_LIGA]: 'La Liga',
    [NewsCategory.SERIE_A]: 'Serie A',
    [NewsCategory.BUNDESLIGA]: 'Bundesliga',
    [NewsCategory.LIBERTADORES]: 'Copa Libertadores',
  },
  es: {
    [NewsCategory.TRANSFERS]: 'fichajes',
    [NewsCategory.CHAMPIONS_LEAGUE]: 'Champions League',
    [NewsCategory.WORLD_CUP]: 'Mundial',
    [NewsCategory.PREMIER_LEAGUE]: 'Premier League',
    [NewsCategory.LA_LIGA]: 'LaLiga',
    [NewsCategory.SERIE_A]: 'Serie A',
    [NewsCategory.BUNDESLIGA]: 'Bundesliga',
    [NewsCategory.LIBERTADORES]: 'Libertadores',
  },
};

/**
 * La búsqueda de Currents es aproximada: llegan también noticias de otros deportes (NFL,
 * rugby, ciclismo, balonmano…) que comparten palabras con el fútbol ("Mundial", "fichajes"),
 * así que cada noticia se filtra también aquí: no es de otro deporte, habla de fútbol (en
 * español) y es del tema de la categoría. Las palabras usan límites Unicode (flag u): \b de
 * JavaScript no reconoce letras con tilde ("árbitro", "esquí").
 */
const OTHER_SPORTS =
  /(?<![\p{L}\p{N}])(nfl|ncaa|cfb|college football|college sports|quarterbacks?|touchdowns?|super bowl|gridiron|tennis|tenis|nba|mlb|nhl|rugby|cricket|golf|formula 1|fórmula 1|f1|motogp|ufc|boxing|boxeo|baseball|béisbol|basketball|baloncesto|básquet|euroliga|euroleague|acb|hockey|darts|snooker|nascar|wwe|wrestling|cycling|ciclismo|ciclistas?|pogacar|pogačar|atletismo|marat[oó]n|marathon|triatl[oó]n|triathlon|natación|swimming|balonmano|handball|voleibol|volleyball|pádel|padel|esquí|ajedrez|chess|gimnasia|judo|remo|medallas?|odi|t20|ipl|wickets?|innings|test series|batting|bowlers?|netball|wallabies|springboks|all blacks|fútbol americano|futsal|fútbol sala)(?![\p{L}\p{N}])/iu;
/** Marcadores como "29-39": son de balonmano o baloncesto, nunca de un partido de fútbol. */
const HIGH_SCORE = /\b[2-9]\d\s?-\s?[2-9]\d\b/;
/**
 * En español "Mundial" y "fichajes" se usan igual en cualquier deporte, así que la noticia debe
 * tener además al menos una de estas palabras. En inglés las palabras clave ya son de fútbol
 * ("transfer news", "Premier League") y basta con descartar los otros deportes.
 */
const FOOTBALL_TERMS: Record<Locale, RegExp | null> = {
  en: null,
  es: /(?<![\p{L}\p{N}])(fútbol|futbol|futbolistas?|fifa|uefa|conmebol|goles?|golazo|goleador(es)?|delanteros?|centrocampistas?|mediocampistas?|volantes?|porteros?|arqueros?|guardametas?|penaltis?|penales|laliga|premier|serie a|bundesliga|ligue 1|champions|europa league|libertadores|sudamericana|selecci[oó]n|seleccionador|balón de oro|derbi|clásico|entrenador|club|árbitros?|liguero|plantilla|jugador(es)?)(?![\p{L}\p{N}])/iu,
};
const CATEGORY_TERMS: Record<Locale, Record<NewsCategory, RegExp>> = {
  en: {
    [NewsCategory.TRANSFERS]: /(?<![\p{L}\p{N}])(transfers?|signings?|signs?|signed|loan|bids?|fee|moves?|gossip|contract|deal|target|release clause)(?![\p{L}\p{N}])/iu,
    [NewsCategory.CHAMPIONS_LEAGUE]: /champions league/i,
    [NewsCategory.WORLD_CUP]: /world cup/i,
    [NewsCategory.PREMIER_LEAGUE]: /premier league/i,
    [NewsCategory.LA_LIGA]: /(?<![\p{L}\p{N}])la ?liga(?![\p{L}\p{N}])/iu,
    [NewsCategory.SERIE_A]: /(?<![\p{L}\p{N}])serie a(?![\p{L}\p{N}])/iu,
    [NewsCategory.BUNDESLIGA]: /bundesliga/i,
    [NewsCategory.LIBERTADORES]: /libertadores/i,
  },
  es: {
    [NewsCategory.TRANSFERS]: /(?<![\p{L}\p{N}])(fichajes?|ficha|fichará|traspasos?|cesión|oferta|contrato|cláusula|refuerzos?|mercado de pases)(?![\p{L}\p{N}])/iu,
    [NewsCategory.CHAMPIONS_LEAGUE]: /champions/i,
    [NewsCategory.WORLD_CUP]: /(?<![\p{L}\p{N}])(mundial|copa del mundo)(?![\p{L}\p{N}])/iu,
    [NewsCategory.PREMIER_LEAGUE]: /premier league/i,
    // "la liga" a secas aparece en cualquier texto ("la liga colombiana"): se pide la española.
    [NewsCategory.LA_LIGA]: /(?<![\p{L}\p{N}])(laliga|la liga (española|ea sports|hypermotion)|liga española|primera división)(?![\p{L}\p{N}])/iu,
    [NewsCategory.SERIE_A]: /(?<![\p{L}\p{N}])serie a(?![\p{L}\p{N}])/iu,
    [NewsCategory.BUNDESLIGA]: /bundesliga/i,
    [NewsCategory.LIBERTADORES]: /libertadores/i,
  },
};

/** ¿La noticia es de fútbol, del tema de la categoría y no de otro deporte? */
export function isRelevant(category: NewsCategory, title: string, description: string, language: Locale = 'en'): boolean {
  const text = `${title} ${description}`;
  const football = FOOTBALL_TERMS[language];
  return !OTHER_SPORTS.test(text) && !HIGH_SCORE.test(text) && (!football || football.test(text)) && CATEGORY_TERMS[language][category].test(text);
}

/** Medios que no publican fútbol o que solo repiten enlaces de otros (foros). */
const BLOCKED_SOURCES = ['cricinfo.com', 'espncricinfo.com', 'reddit.com'];

export function isBlockedSource(url: string): boolean {
  const host = new URL(url).hostname.replace(/^www\./, '');
  return BLOCKED_SOURCES.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** Nombres legibles de las fuentes más comunes; el resto se muestra con su dominio. */
const SOURCE_NAMES: Record<string, string> = {
  'bbc.co.uk': 'BBC Sport',
  'bbc.com': 'BBC Sport',
  'skysports.com': 'Sky Sports',
  'espn.com': 'ESPN',
  'espn.co.uk': 'ESPN',
  'theguardian.com': 'The Guardian',
  'goal.com': 'Goal',
  'marca.com': 'Marca',
  'as.com': 'AS',
  'mundodeportivo.com': 'Mundo Deportivo',
  'sport.es': 'Sport',
  'elpais.com': 'El País',
  'ole.com.ar': 'Olé',
  'eltiempo.com': 'El Tiempo',
  'theathletic.com': 'The Athletic',
  'nytimes.com': 'The Athletic',
  'reuters.com': 'Reuters',
  'apnews.com': 'AP',
};

interface CurrentsArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  published: string;
}

/** "2026-09-24 14:05:00 +0000" → Date. */
export function parseCurrentsDate(value: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/.exec(value?.trim() ?? '');
  const date = match ? new Date(`${match[1]}T${match[2]}${match[3]}:${match[4]}`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function sourceNameFromUrl(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, '');
  const known = Object.keys(SOURCE_NAMES).find((domain) => host === domain || host.endsWith(`.${domain}`));
  return known ? SOURCE_NAMES[known] : host;
}

/**
 * Adapter de Currents API (https://currentsapi.services). Plan gratuito: 250 peticiones/día,
 * sin retraso, pensado para prototipos. La clave va en el header Authorization.
 */
@Injectable()
export class CurrentsNewsProvider extends NewsProvider {
  readonly name = 'Currents API';
  private readonly logger = new Logger(CurrentsNewsProvider.name);
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    super();
    this.apiKey = config.getOrThrow<string>('NEWS_API_KEY');
  }

  async fetchLatest(category: NewsCategory, language: Locale): Promise<ExternalArticle[]> {
    const params = new URLSearchParams({
      keywords: CATEGORY_KEYWORDS[language][category],
      category: 'sports',
      language,
      start_date: new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString(),
      page_size: '20', // máximo que acepta Currents
    });
    const response = await fetch(`${CURRENTS_BASE_URL}/search?${params}`, {
      headers: { Authorization: this.apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Currents API respondió ${response.status}`);
    const body = (await response.json()) as { status?: string; news?: CurrentsArticle[] };
    if (body.status !== 'ok' || !Array.isArray(body.news)) throw new Error('Respuesta inesperada de Currents API');

    const articles: ExternalArticle[] = [];
    for (const item of body.news) {
      const sourceUrl = safeHttpUrl(item.url);
      const publishedAt = parseCurrentsDate(item.published);
      if (!item.id || !item.title?.trim() || !sourceUrl || !publishedAt) {
        this.logger.debug(`Noticia descartada por datos incompletos: ${item.id}`);
        continue;
      }
      if (isBlockedSource(sourceUrl) || !isRelevant(category, item.title, item.description ?? '', language)) {
        this.logger.debug(`Noticia descartada por no ser de fútbol o de "${category}": ${item.title}`);
        continue;
      }
      articles.push({
        externalId: `currents:${item.id}`,
        title: item.title.trim().slice(0, 300),
        description: (item.description ?? '').trim(),
        source: sourceNameFromUrl(sourceUrl),
        sourceUrl,
        imageUrl: item.image && item.image !== 'None' ? safeHttpUrl(item.image) : null,
        publishedAt,
      });
    }
    return articles;
  }
}
