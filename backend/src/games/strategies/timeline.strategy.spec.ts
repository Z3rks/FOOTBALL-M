import { GAMES } from '../../database/seeds/data/games.data';
import { Question } from '../entities/question.entity';
import { GameFactory } from './game.factory';
import { parseTimeline, TimelineStrategy } from './timeline.strategy';

const EVENTS: Array<[string, number]> = [
  ['Italia gana su primer Mundial', 1934],
  ['Maracanazo: Uruguay campeón en Brasil', 1950],
  ['Pelé gana su primer Mundial', 1958],
  ['Inglaterra campeón en Wembley', 1966],
];
const question = { correctAnswer: JSON.stringify(EVENTS) } as Question;
const inOrder = EVENTS.map(([event]) => event);

describe('TimelineStrategy', () => {
  const strategy = new TimelineStrategy();

  it('acepta el orden cronológico completo (sin importar tildes ni mayúsculas)', () => {
    expect(strategy.isCorrect(question, JSON.stringify(inOrder))).toBe(true);
    expect(strategy.isCorrect(question, JSON.stringify(inOrder.map((e) => e.toUpperCase())))).toBe(true);
  });

  it('acepta también la respuesta en pares [evento, año]', () => {
    expect(strategy.isCorrect(question, question.correctAnswer)).toBe(true);
  });

  it('rechaza cualquier otro orden, aunque solo cambien dos eventos', () => {
    const swapped = [inOrder[1], inOrder[0], inOrder[2], inOrder[3]];
    expect(strategy.isCorrect(question, JSON.stringify(swapped))).toBe(false);
  });

  it('rechaza respuestas incompletas o mal formadas sin lanzar error', () => {
    expect(strategy.isCorrect(question, JSON.stringify(inOrder.slice(0, 3)))).toBe(false);
    expect(strategy.isCorrect(question, 'Italia gana su primer Mundial')).toBe(false);
    expect(strategy.isCorrect(question, '{"no":"es una lista"}')).toBe(false);
    expect(strategy.isCorrect({ correctAnswer: 'sin formato' } as Question, JSON.stringify(inOrder))).toBe(false);
  });

  it('GameFactory usa TimelineStrategy para Timeline y el frontend recibe su estilo', () => {
    const factory = new GameFactory();
    expect(factory.forGame({ strategyKey: 'timeline' })).toBeInstanceOf(TimelineStrategy);
    expect(factory.forGame({ strategyKey: 'timeline' }).playStyle).toBe('timeline');
    expect(factory.forGame({ strategyKey: 'who-is-it' }).playStyle).toBe('clues');
  });
});

describe('Preguntas de Timeline en la semilla', () => {
  const timeline = GAMES.find((g) => g.strategyKey === 'timeline')!;

  it.each(timeline.questions.map((q) => [q.statement, q]))('"%s" es una línea de tiempo válida', (_statement, q) => {
    const entries = parseTimeline(q.correctAnswer);
    expect(entries).toHaveLength(4);
    const years = entries!.map(([, year]) => year);
    expect(years).toEqual([...years].sort((a, b) => a - b)); // de la más antigua a la más reciente
    expect(new Set(years).size).toBe(4); // sin empates: el orden es único
    expect([...q.options!].sort()).toEqual(entries!.map(([event]) => event).sort()); // las mismas 4 opciones
    expect(q.options).not.toEqual(entries!.map(([event]) => event)); // se muestran desordenadas
    // Caben en QUESTION.correct_answer y en la respuesta del jugador (máximo 255 caracteres).
    expect(q.correctAnswer.length).toBeLessThanOrEqual(255);
    expect(JSON.stringify(entries!.map(([event]) => event)).length).toBeLessThanOrEqual(255);
  });

  it('las líneas de tiempo tienen enunciados distintos', () => {
    expect(new Set(timeline.questions.map((q) => q.statement)).size).toBe(timeline.questions.length);
    expect(timeline.questions.length).toBeGreaterThanOrEqual(20);
  });
});
