import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PlayerGameStatsReader } from '../games/player-game-stats.reader';
import { UnitOfWork } from '../shared/database/unit-of-work';
import { DomainEvents, GameCompletedEvent, ItemPurchasedEvent, StreakReachedEvent } from '../shared/events/domain-events';
import { AppClock } from '../shared/time/app-clock';
import { BadgesService } from './badges.service';
import { BadgeCode } from './entities/badge.entity';
import { levelForXp, nextStreak, reachedStreakReward } from './progress';
import { UsersRepository } from './repositories/users.repository';

/** Umbrales de las insignias (descripciones en el seed de insignias). */
const DAILY_HUNTER_CHALLENGES = 10;
const STREAK_BADGE_DAYS = 7;
const LEGEND_LEVEL = 20;

/**
 * Escucha GameCompletedEvent (Arquitectura §5) y actualiza el progreso del jugador:
 * XP, nivel, racha, precisión histórica e insignias.
 */
@Injectable()
export class ProgressListener {
  private readonly logger = new Logger(ProgressListener.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly users: UsersRepository,
    private readonly gameStats: PlayerGameStatsReader,
    private readonly badges: BadgesService,
    private readonly events: EventEmitter2,
    private readonly clock: AppClock,
  ) {}

  @OnEvent(DomainEvents.GAME_COMPLETED)
  async onGameCompleted(event: GameCompletedEvent): Promise<void> {
    // La partida ya quedó guardada: un error aquí se registra, pero no debe hacer fallar su cierre.
    try {
      await this.applyGameCompleted(event);
    } catch (error) {
      this.logger.error(`No se pudo actualizar el progreso del usuario ${event.userId} (partida ${event.sessionId})`, error as Error);
    }
  }

  /** Insignia "Coleccionista" con la primera compra en la tienda. */
  @OnEvent(DomainEvents.ITEM_PURCHASED)
  async onItemPurchased(event: ItemPurchasedEvent): Promise<void> {
    try {
      await this.badges.award(event.userId, [BadgeCode.COLLECTOR]);
    } catch (error) {
      this.logger.error(`No se pudo otorgar la insignia Coleccionista al usuario ${event.userId}`, error as Error);
    }
  }

  async applyGameCompleted(event: GameCompletedEvent): Promise<void> {
    const streakReward = await this.unitOfWork.run(async () => {
      // Bloqueo por usuario: dos partidas que terminan a la vez no se pisan la XP.
      const user = await this.users.findByIdForUpdate(event.userId);
      if (!user) return null;

      const playedOn = this.clock.dateOf(event.completedAt);
      const streakDays = nextStreak(user.streakDays, user.lastPlayedOn, playedOn);
      const xpTotal = user.xpTotal + event.xpEarned;
      const level = levelForXp(xpTotal);
      const stats = await this.gameStats.getPlayerStats(user.id);
      const accuracy = stats.answeredQuestions ? Math.round((stats.correctAnswers / stats.answeredQuestions) * 10_000) / 100 : 0;
      const lastPlayedOn = user.lastPlayedOn && user.lastPlayedOn > playedOn ? user.lastPlayedOn : playedOn;

      await this.users.update(user.id, { xpTotal, level, streakDays, lastPlayedOn, accuracy });

      const earned: BadgeCode[] = [BadgeCode.FIRST_GAME];
      if (event.score === event.totalQuestions) earned.push(BadgeCode.PERFECT_GAME);
      if (streakDays >= STREAK_BADGE_DAYS) earned.push(BadgeCode.STREAK_7);
      if (stats.dailyChallengesCompleted >= DAILY_HUNTER_CHALLENGES) earned.push(BadgeCode.DAILY_HUNTER);
      if (stats.categoriesAvailable > 0 && stats.categoriesPlayed >= stats.categoriesAvailable) earned.push(BadgeCode.ALL_ROUNDER);
      if (level >= LEGEND_LEVEL) earned.push(BadgeCode.LEGEND);
      await this.badges.award(user.id, earned);

      return reachedStreakReward(user.streakDays, streakDays) ? streakDays : null;
    });

    if (streakReward) await this.events.emitAsync(DomainEvents.STREAK_REACHED, new StreakReachedEvent(event.userId, streakReward));
  }
}
