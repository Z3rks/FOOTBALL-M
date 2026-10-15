import { Injectable } from '@nestjs/common';
import { Locale } from '../../shared/i18n/locale';
import { NewsCategory } from '../entities/news-article.entity';
import { ExternalArticle, NewsProvider } from '../news.provider';

const IMAGE = (id: string) => `https://images.unsplash.com/${id}?w=400&h=200&fit=crop`;

/** Las noticias de la maqueta de NewsScreen, marcadas como ejemplo, en inglés y español. */
const SAMPLES: Array<{ category: NewsCategory; hoursAgo: number; title: string; description: string; image: string; es: { title: string; description: string } }> = [
  { category: NewsCategory.CHAMPIONS_LEAGUE, hoursAgo: 2, title: 'Real Madrid wins Champions League final in dramatic fashion', description: 'Los Blancos secure their 15th European Cup with a last-minute winner', image: 'photo-1579952363873-27f3bade9f55', es: { title: 'El Real Madrid gana una final de Champions de infarto', description: 'Los blancos levantan su 15.ª Copa de Europa con un gol en el último minuto' } },
  { category: NewsCategory.TRANSFERS, hoursAgo: 5, title: 'Record transfer: Mbappé completes move to Real Madrid', description: 'French superstar signs five-year deal in blockbuster transfer', image: 'photo-1522778119026-d647f0596c20', es: { title: 'Fichaje récord: Mbappé cierra su llegada al Real Madrid', description: 'La estrella francesa firma por cinco temporadas en un traspaso histórico' } },
  { category: NewsCategory.PREMIER_LEAGUE, hoursAgo: 8, title: 'Manchester City maintains perfect start to the season', description: 'Haaland scores hat-trick as City demolish rivals 5-0', image: 'photo-1508098682722-e99c43a406b2', es: { title: 'El Manchester City mantiene su arranque perfecto', description: 'Haaland marca un hat-trick y el City golea 5-0 a su rival' } },
  { category: NewsCategory.WORLD_CUP, hoursAgo: 12, title: 'World Cup 2026: Venues announced for North American tournament', description: 'FIFA reveals the stadiums that will host the expanded 48-team competition', image: 'photo-1431324155629-1a6deb1dec8d', es: { title: 'Mundial 2026: anunciadas las sedes del torneo en Norteamérica', description: 'La FIFA revela los estadios del primer Mundial con 48 selecciones' } },
  { category: NewsCategory.TRANSFERS, hoursAgo: 24, title: 'Liverpool signs promising young midfielder from Bundesliga', description: 'Reds secure signature of German talent in £45m deal', image: 'photo-1574629810360-7efbbe195018', es: { title: 'El Liverpool ficha a una joven promesa de la Bundesliga', description: 'Los reds cierran el fichaje del talento alemán por 45 millones de libras' } },
  { category: NewsCategory.CHAMPIONS_LEAGUE, hoursAgo: 30, title: "Barcelona's youngsters shine in Champions League victory", description: 'La Masia graduates lead Barça to impressive 3-1 away win', image: 'photo-1560272564-c83b66b1ad12', es: { title: 'Los jóvenes del Barcelona brillan en la victoria en Champions', description: 'Los canteranos de La Masia guían al Barça a un 3-1 a domicilio' } },
  { category: NewsCategory.LA_LIGA, hoursAgo: 36, title: 'Atlético Madrid climb to the top of La Liga', description: 'Griezmann scores twice in a 2-0 home win', image: 'photo-1517466787929-bc90951d0974', es: { title: 'El Atlético de Madrid se sube a lo más alto de LaLiga', description: 'Griezmann marca dos goles en la victoria 2-0 en casa' } },
  { category: NewsCategory.SERIE_A, hoursAgo: 48, title: 'Inter and Napoli share the points in Serie A thriller', description: 'A late penalty rescues a 2-2 draw at San Siro', image: 'photo-1489944440615-453fc2b6a9a9', es: { title: 'Inter y Napoli empatan en un partidazo de la Serie A', description: 'Un penalti en el descuento deja el 2-2 en San Siro' } },
  { category: NewsCategory.BUNDESLIGA, hoursAgo: 60, title: 'Bayern Munich stay unbeaten in the Bundesliga', description: 'Kane reaches ten league goals as Bayern win 4-1', image: 'photo-1551958219-acbc608c6377', es: { title: 'El Bayern de Múnich sigue invicto en la Bundesliga', description: 'Kane llega a diez goles en liga en el 4-1 del Bayern' } },
  { category: NewsCategory.LIBERTADORES, hoursAgo: 72, title: 'Flamengo reach the Copa Libertadores semi-finals', description: 'The Brazilian club win the second leg on penalties', image: 'photo-1606925797300-0b35e9d1794e', es: { title: 'Flamengo se mete en las semifinales de la Copa Libertadores', description: 'El club brasileño gana la vuelta en la tanda de penaltis' } },
];

/**
 * Proveedor de desarrollo, usado cuando NEWS_API_KEY está vacío: así cualquiera del equipo puede
 * trabajar con NewsScreen sin registrarse en Currents. La fuente dice "Ejemplo" y los enlaces
 * apuntan a example.com, para que nadie los confunda con noticias reales.
 */
@Injectable()
export class SampleNewsProvider extends NewsProvider {
  readonly name = 'Noticias de ejemplo';

  async fetchLatest(category: NewsCategory, language: Locale): Promise<ExternalArticle[]> {
    return SAMPLES.map((sample, index) => ({ ...sample, index }))
      .filter((sample) => sample.category === category)
      .map((sample) => ({
        externalId: `sample:${language}:${sample.index + 1}`,
        title: language === 'es' ? sample.es.title : sample.title,
        description: language === 'es' ? sample.es.description : sample.description,
        source: language === 'es' ? 'Ejemplo' : 'Sample',
        sourceUrl: `https://example.com/football-maestro/${language}/noticia-${sample.index + 1}`,
        imageUrl: IMAGE(sample.image),
        publishedAt: new Date(Date.now() - sample.hoursAgo * 3_600_000),
      }));
  }
}
