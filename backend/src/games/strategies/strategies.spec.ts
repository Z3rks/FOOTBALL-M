import { InternalServerErrorException } from '@nestjs/common';
import { Question } from '../entities/question.entity';
import { GameDifficulty } from '../enums';
import { GameFactory } from './game.factory';
import { MultipleChoiceStrategy } from './multiple-choice.strategy';
import { normalizeAnswer } from './normalize-answer';

const question = (correctAnswer: string) => ({ correctAnswer }) as Question;

describe('MultipleChoiceStrategy', () => {
  const strategy = new MultipleChoiceStrategy();

  it.each([
    ['Atlético de Madrid', 'atletico de madrid'],
    ['Atlético de Madrid', '  ATLÉTICO   de Madrid '],
    ['Sí', 'si'],
  ])('acepta "%s" respondido como "%s"', (correct, given) => {
    expect(strategy.isCorrect(question(correct), given)).toBe(true);
  });

  it('rechaza una respuesta distinta', () => {
    expect(strategy.isCorrect(question('Real Madrid'), 'Atlético de Madrid')).toBe(false);
  });

  it.each([
    [GameDifficulty.EASY, 8, 80],
    [GameDifficulty.MEDIUM, 8, 100],
    [GameDifficulty.HARD, 8, 120],
    [GameDifficulty.EXPERT, 8, 160],
    [GameDifficulty.MEDIUM, 3, 38],
    [GameDifficulty.EXPERT, 0, 0],
  ])('XP en %s con %i aciertos = %i', (difficulty, correct, xp) => {
    expect(strategy.xpFor(correct, difficulty)).toBe(xp);
  });

  it('normalizeAnswer quita tildes, mayúsculas y espacios repetidos', () => {
    expect(normalizeAnswer('  Luka   MODRIĆ ')).toBe('luka modric');
  });
});

describe('GameFactory', () => {
  const factory = new GameFactory();

  it('tiene una estrategia registrada para cada minijuego del catálogo', () => {
    for (const key of ['who-is-it', 'silhouette', 'guess-the-badge', 'guess-the-stadium', 'connections', 'timeline', 'the-transfer', 'how-much-was-he-worth', 'dream-team', 'goal-or-no-goal']) {
      expect(factory.forGame({ strategyKey: key })).toBeDefined();
    }
  });

  it('falla con un error de servidor si un minijuego no tiene estrategia', () => {
    expect(() => factory.forGame({ strategyKey: 'no-existe' })).toThrow(InternalServerErrorException);
  });
});
