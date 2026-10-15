import { readableAnswer } from './readable-answer';

describe('readableAnswer (preguntas más difíciles del panel administrativo)', () => {
  it('deja tal cual las respuestas de texto', () => {
    expect(readableAnswer('Lionel Messi')).toBe('Lionel Messi');
    expect(readableAnswer('222')).toBe('222');
  });

  it('resume la decisión del VAR y los grupos de Connections', () => {
    expect(readableAnswer(JSON.stringify({ a: 'No goal', w: 'Explanation' }))).toBe('No goal');
    expect(readableAnswer(JSON.stringify([['Goalkeepers', ['A', 'B', 'C', 'D']], ['Strikers', ['E', 'F', 'G', 'H']]]))).toBe('Goalkeepers / Strikers');
  });

  it('no resume el orden de Timeline ni un JSON que no reconoce', () => {
    expect(readableAnswer(JSON.stringify([['Event', 1990], ['Other', 2000]]))).toBeNull();
    expect(readableAnswer('{roto')).toBeNull();
  });
});
