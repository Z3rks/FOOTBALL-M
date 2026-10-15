import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Game } from '../entities/game.entity';
import { ConnectionsStrategy } from './connections.strategy';
import { GameStrategy } from './game-strategy';
import { MultipleChoiceStrategy } from './multiple-choice.strategy';
import { TimelineStrategy } from './timeline.strategy';
import { ValueGuessStrategy } from './value-guess.strategy';
import { VarStrategy } from './var.strategy';

/**
 * GameFactory (Arquitectura §6, patrón Factory Method): elige la estrategia de un minijuego
 * según su strategy_key. Cada minijuego tiene su estilo propio; los que comparten la regla de
 * opción múltiple la reciben con su estilo visual. Un minijuego nuevo solo se registra aquí.
 */
@Injectable()
export class GameFactory {
  private readonly strategies = new Map<string, GameStrategy>([
    ['who-is-it', new MultipleChoiceStrategy('clues')],
    ['silhouette', new MultipleChoiceStrategy('silhouette')],
    ['guess-the-badge', new MultipleChoiceStrategy('crest')],
    ['guess-the-stadium', new MultipleChoiceStrategy('stadium')],
    ['connections', new ConnectionsStrategy()],
    ['timeline', new TimelineStrategy()],
    ['the-transfer', new MultipleChoiceStrategy('career')],
    ['how-much-was-he-worth', new ValueGuessStrategy()],
    ['dream-team', new MultipleChoiceStrategy('lineup')],
    ['goal-or-no-goal', new VarStrategy()],
  ]);

  forGame(game: Pick<Game, 'strategyKey'>): GameStrategy {
    const strategy = this.strategies.get(game.strategyKey);
    // Un minijuego sin estrategia es un error de configuración (seed o código), no del usuario.
    if (!strategy) throw new InternalServerErrorException(`No strategy registered for game "${game.strategyKey}"`);
    return strategy;
  }
}
