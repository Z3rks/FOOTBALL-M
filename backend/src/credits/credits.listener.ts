import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvents, GameCompletedEvent, ResultSharedEvent, StreakReachedEvent, UserRegisteredEvent } from '../shared/events/domain-events';
import { CreditReason } from './entities/credit-transaction.entity';
import { CreditsService } from './credits.service';

/**
 * Recompensas de créditos (RF-115) a partir de eventos de otros módulos (Arquitectura §5).
 * Un error aquí se registra pero no hace fallar la acción que originó el evento (la partida
 * ya se completó, el usuario ya se registró…).
 */
@Injectable()
export class CreditsListener {
  private readonly logger = new Logger(CreditsListener.name);

  constructor(private readonly credits: CreditsService) {}

  /** +50 al completar el reto diario (una vez por día: Games solo marca así la primera partida). */
  @OnEvent(DomainEvents.GAME_COMPLETED)
  async onGameCompleted(event: GameCompletedEvent): Promise<void> {
    if (!event.isDailyChallenge) return;
    await this.safely('reto diario', () => this.credits.earn(event.userId, CreditReason.DAILY_CHALLENGE, event.sessionId));
  }

  /** +25 la primera vez que se comparte un resultado. */
  @OnEvent(DomainEvents.RESULT_SHARED)
  async onResultShared(event: ResultSharedEvent): Promise<void> {
    await this.safely('compartir', () => this.credits.earn(event.userId, CreditReason.SHARE_RESULT, event.sessionId));
  }

  /** +100 cada 7 días de racha. */
  @OnEvent(DomainEvents.STREAK_REACHED)
  async onStreakReached(event: StreakReachedEvent): Promise<void> {
    await this.safely('racha', () => this.credits.earn(event.userId, CreditReason.STREAK_7_DAYS, null));
  }

  /** +200 a quien invitó a un usuario nuevo. */
  @OnEvent(DomainEvents.USER_REGISTERED)
  async onUserRegistered(event: UserRegisteredEvent): Promise<void> {
    if (!event.referredById) return;
    await this.safely('referido', () => this.credits.earn(event.referredById!, CreditReason.REFERRAL, event.userId));
  }

  private async safely(label: string, reward: () => Promise<boolean>): Promise<void> {
    try {
      await reward();
    } catch (error) {
      this.logger.error(`No se pudo otorgar la recompensa de créditos (${label})`, error as Error);
    }
  }
}
