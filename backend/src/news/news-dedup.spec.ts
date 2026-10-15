import { titleKey, withoutRepeats } from './news-dedup';
import { ExternalArticle } from './news.provider';

const article = (externalId: string, title: string, imageUrl: string | null = null): ExternalArticle => ({
  externalId,
  title,
  description: '',
  source: 'Medio',
  sourceUrl: `https://example.com/${externalId}`,
  imageUrl,
  publishedAt: new Date('2026-09-27T12:00:00Z'),
});

describe('noticias repetidas (RF-179)', () => {
  it('titleKey ignora mayúsculas, espacios y signos, pero conserva las tildes', () => {
    expect(titleKey("España gana el Mundial sub'20")).toBe(titleKey('ESPAÑA gana el Mundial sub-20!'));
    expect(titleKey('Árbitro del Mundial')).toBe('árbitrodelmundial');
  });

  it('quita la que ya está guardada por otro medio (mismo título o misma imagen)', () => {
    const saved = [{ externalId: 'a', titleKey: titleKey('El City, culpable'), imageUrl: 'https://img/1.jpg' }];
    const fresh = withoutRepeats(
      [article('b', 'EL CITY, CULPABLE'), article('c', 'Otro titular', 'https://img/1.jpg'), article('d', 'Noticia nueva')],
      saved,
    );
    expect(fresh.map((a) => a.externalId)).toEqual(['d']);
  });

  it('la misma noticia (mismo externalId) no es repetida: se actualiza', () => {
    const saved = [{ externalId: 'a', titleKey: titleKey('Título viejo'), imageUrl: 'https://img/1.jpg' }];
    const fresh = withoutRepeats([article('a', 'Título viejo', 'https://img/1.jpg')], saved);
    expect(fresh).toEqual([expect.objectContaining({ externalId: 'a', titleKey: titleKey('Título viejo') })]);
  });

  it('quita las repetidas dentro de la misma respuesta del proveedor; sin imagen no cuenta como repetida', () => {
    const fresh = withoutRepeats([article('a', 'Gol de Messi'), article('b', 'Gol de Messi'), article('c', 'Otra', null), article('d', 'Otra más', null)], []);
    expect(fresh.map((a) => a.externalId)).toEqual(['a', 'c', 'd']);
  });
});
