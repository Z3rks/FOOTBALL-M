import { localize, parseLocale, Translations } from './locale';

describe('parseLocale', () => {
  it.each([
    ['es-CO,es;q=0.9,en;q=0.8', 'es'],
    ['es', 'es'],
    ['EN-us', 'en'],
    ['fr-FR,fr;q=0.9', 'en'], // idioma no soportado → inglés
    ['', 'en'],
    [undefined, 'en'],
  ])('"%s" → %s', (header, expected) => {
    expect(parseLocale(header)).toBe(expected);
  });
});

describe('localize', () => {
  const game = { id: '1', name: 'Timeline', description: 'Order events', translations: { es: { name: 'Línea de tiempo' } } as Translations<{ name: string; description: string }> };

  it('usa la traducción de los campos que la tienen y deja el original en los demás', () => {
    expect(localize(game, 'es')).toMatchObject({ id: '1', name: 'Línea de tiempo', description: 'Order events' });
  });

  it('sin traducción a ese idioma devuelve el original, sin copiarlo ni modificarlo', () => {
    expect(localize(game, 'en')).toBe(game);
    expect(localize({ name: 'X', translations: null }, 'es').name).toBe('X');
    localize(game, 'es');
    expect(game.name).toBe('Timeline');
  });
});
