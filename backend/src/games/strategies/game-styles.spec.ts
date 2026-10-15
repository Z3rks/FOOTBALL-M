import { GAMES, GameSeed } from '../../database/seeds/data/games.data';
import { QUESTIONS_EN } from '../../database/seeds/data/games.en.data';
import { QuestionSeed } from '../../database/seeds/data/question-builders';
import { Question } from '../entities/question.entity';
import { ConnectionsStrategy, parseGroups } from './connections.strategy';
import { GameFactory } from './game.factory';
import { MultipleChoiceStrategy } from './multiple-choice.strategy';
import { ValueGuessStrategy } from './value-guess.strategy';
import { parseVerdict, VarStrategy } from './var.strategy';

const q = (correctAnswer: string) => ({ correctAnswer }) as Question;
const gameOf = (key: string) => GAMES.find((g) => g.strategyKey === key)!;

describe('ConnectionsStrategy', () => {
  const strategy = new ConnectionsStrategy();
  const board = q(JSON.stringify([['A', ['Uno', 'Dos', 'Tres', 'Cuatro']], ['B', ['Cinco', 'Seis', 'Siete', 'Ocho']]]));

  it('acepta cualquiera de los dos grupos, en cualquier orden y sin importar tildes', () => {
    expect(strategy.isCorrect(board, JSON.stringify(['Cuatro', 'uno', 'Tres', 'Dos']))).toBe(true);
    expect(strategy.isCorrect(board, JSON.stringify(['Ocho', 'Siete', 'Seis', 'Cinco']))).toBe(true);
  });

  it('rechaza grupos mezclados, incompletos o repetidos, sin lanzar error', () => {
    expect(strategy.isCorrect(board, JSON.stringify(['Uno', 'Dos', 'Tres', 'Cinco']))).toBe(false);
    expect(strategy.isCorrect(board, JSON.stringify(['Uno', 'Dos', 'Tres']))).toBe(false);
    expect(strategy.isCorrect(board, JSON.stringify(['Uno', 'Uno', 'Dos', 'Tres']))).toBe(false);
    expect(strategy.isCorrect(board, 'Uno')).toBe(false);
  });
});

describe('ValueGuessStrategy', () => {
  const strategy = new ValueGuessStrategy();

  it.each([
    ['222', '222', true],
    ['222', '200', true], // dentro del 10 %
    ['222', '199', false],
    ['40', '36', true], // margen mínimo de 5 millones
    ['40', '34', false],
    ['105', '€110 millones', true],
    ['105', 'mucho', false],
  ])('valor real %s, respuesta "%s" → %s', (actual, guess, expected) => {
    expect(strategy.isCorrect(q(actual), guess)).toBe(expected);
  });
});

describe('VarStrategy', () => {
  const strategy = new VarStrategy();
  const call = q(JSON.stringify({ a: 'No gol', w: 'Regla' }));

  it('compara solo la decisión y acepta también la respuesta completa', () => {
    expect(strategy.isCorrect(call, 'no gol')).toBe(true);
    expect(strategy.isCorrect(call, 'Gol')).toBe(false);
    expect(strategy.isCorrect(call, call.correctAnswer)).toBe(true);
  });
});

describe('GameFactory: un estilo propio por minijuego', () => {
  const factory = new GameFactory();

  it('los 10 minijuegos tienen estilos distintos', () => {
    const styles = GAMES.map((g) => factory.forGame(g).playStyle);
    expect(new Set(styles).size).toBe(10);
    expect(styles).not.toContain('multiple-choice');
  });

  it('los que comparten la regla de opción múltiple la reciben con su estilo', () => {
    expect(factory.forGame({ strategyKey: 'who-is-it' })).toBeInstanceOf(MultipleChoiceStrategy);
    expect(factory.forGame({ strategyKey: 'who-is-it' }).playStyle).toBe('clues');
  });
});

/** El banco original (español) y su traducción al inglés deben cumplir las mismas reglas. */
const BANKS: Array<[string, (game: GameSeed) => QuestionSeed[]]> = [
  ['original', (game) => game.questions],
  ['en', (game) => QUESTIONS_EN[game.strategyKey] ?? []],
];

describe.each(BANKS)('Contenido de los minijuegos en la semilla (%s)', (_bank, questionsOf) => {
  const factory = new GameFactory();
  const all = GAMES.flatMap((g) => questionsOf(g).map((question) => ({ game: g, question })));
  const bankOf = (key: string) => questionsOf(gameOf(key));

  it.each(all.map(({ game, question }) => [game.name, question.statement, game, question]))('%s · "%s": la respuesta correcta es válida para su estrategia', (_n, _s, game, question) => {
    expect(question.correctAnswer.length).toBeLessThanOrEqual(255);
    expect(factory.forGame(game).isCorrect({ ...question } as unknown as Question, question.correctAnswer)).toBe(true);
    // Los datos públicos del estilo nunca contienen la respuesta.
    if (question.details && !['connections', 'timeline'].includes(game.strategyKey)) {
      expect(JSON.stringify(question.details)).not.toContain(question.correctAnswer);
    }
  });

  it('cada minijuego tiene al menos 5 preguntas con enunciados distintos', () => {
    for (const game of GAMES) {
      const questions = questionsOf(game);
      expect(questions.length).toBeGreaterThanOrEqual(5);
      expect(new Set(questions.map((x) => x.statement)).size).toBe(questions.length);
    }
  });

  it('opción múltiple con estilo: 4 opciones distintas que incluyen la respuesta, y sus datos de estilo', () => {
    const required: Record<string, string[]> = {
      'who-is-it': ['clues'],
      silhouette: ['flag', 'position', 'era', 'fact'],
      'guess-the-badge': ['colors', 'initials', 'city', 'founded'],
      'guess-the-stadium': ['flag', 'city', 'capacity', 'opened'],
      'the-transfer': ['player', 'year', 'path'],
      'dream-team': ['team', 'formation', 'rows'],
    };
    for (const [key, fields] of Object.entries(required)) {
      for (const question of bankOf(key)) {
        expect(new Set(question.options).size).toBe(4);
        expect(question.options).toContain(question.correctAnswer);
        for (const field of fields) expect(question.details).toHaveProperty(field);
      }
    }
  });

  it('Dream Team: cada alineación tiene 11 jugadores y oculta exactamente uno', () => {
    for (const question of bankOf('dream-team')) {
      const rows = question.details!.rows as Array<Array<string | null>>;
      const cells = rows.flat();
      expect(cells).toHaveLength(11);
      expect(cells.filter((c) => c === null)).toHaveLength(1);
    }
  });

  it('Connections: 2 grupos de 4 con 8 jugadores distintos, los mismos que muestra el tablero', () => {
    for (const question of bankOf('connections')) {
      const groups = parseGroups(question.correctAnswer)!;
      expect(groups).toHaveLength(2);
      const members = groups.flatMap(([, m]) => m);
      expect(new Set(members).size).toBe(8);
      expect([...question.options!].sort()).toEqual([...members].sort());
    }
  });

  it('How much was he worth?: valor numérico en millones y sin opciones (se usa un deslizador)', () => {
    for (const question of bankOf('how-much-was-he-worth')) {
      expect(question.options).toBeNull();
      expect(Number(question.correctAnswer)).toBeGreaterThan(0);
      expect(Number(question.correctAnswer)).toBeLessThanOrEqual(question.details!.max as number);
    }
  });

  it('Goal or No Goal?: la decisión es una de las 2 opciones y trae su explicación', () => {
    for (const question of bankOf('goal-or-no-goal')) {
      const verdict = parseVerdict(question.correctAnswer)!;
      expect(question.options).toHaveLength(2);
      expect(question.options).toContain(verdict.a);
      expect(verdict.w.length).toBeGreaterThan(20);
    }
  });
});

describe('Traducción al inglés del banco de preguntas', () => {
  const pairs = GAMES.flatMap((game) => game.questions.map((original, i) => ({ game, original, en: QUESTIONS_EN[game.strategyKey]?.[i] })));

  it('cada minijuego tiene su nombre en español y todas sus preguntas traducidas, sin sobrantes', () => {
    expect(Object.keys(QUESTIONS_EN).sort()).toEqual(GAMES.map((g) => g.strategyKey).sort());
    for (const game of GAMES) {
      expect(game.translations.es?.name).toBeTruthy();
      expect(game.translations.es?.description).toBeTruthy();
      expect(QUESTIONS_EN[game.strategyKey]).toHaveLength(game.questions.length);
    }
  });

  it.each(pairs.map(({ game, original, en }) => [game.strategyKey, original.statement, original, en!]))(
    '%s · "%s": la traducción tiene la misma forma que el original',
    (key, _s, original, en) => {
      expect(en.options?.length ?? null).toBe(original.options?.length ?? null);
      expect(Object.keys(en.details ?? {}).sort()).toEqual(Object.keys(original.details ?? {}).sort());
      // Los datos que no son texto (colores, banderas, años, cifras, formación) no cambian con el idioma.
      for (const field of ['colors', 'initials', 'flag', 'founded', 'capacity', 'opened', 'year', 'formation', 'max', 'step']) {
        expect(en.details?.[field]).toEqual(original.details?.[field]);
      }
      if (key === 'how-much-was-he-worth') expect(en.correctAnswer).toBe(original.correctAnswer);
      if (key === 'connections') {
        // Los mismos 8 jugadores, en los mismos grupos y en el mismo lugar del tablero.
        expect(en.options).toEqual(original.options);
        expect(parseGroups(en.correctAnswer)!.map(([, m]) => m)).toEqual(parseGroups(original.correctAnswer)!.map(([, m]) => m));
      }
      if (key === 'timeline') {
        // Mismos años y los eventos se muestran en el mismo orden en los dos idiomas.
        const years = (answer: string) => (JSON.parse(answer) as Array<[string, number]>).map(([, year]) => year);
        expect(years(en.correctAnswer)).toEqual(years(original.correctAnswer));
        const position = (q: QuestionSeed) => q.options!.map((o) => (JSON.parse(q.correctAnswer) as Array<[string, number]>).findIndex(([event]) => event === o));
        expect(position(en)).toEqual(position(original));
      }
      if (key === 'dream-team') expect(en.details!.rows).toEqual(original.details!.rows);
    },
  );
});
