import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvents, PasswordChangedEvent, UserSuspendedEvent } from '../shared/events/domain-events';
import { AuthTokensService } from './auth-tokens.service';

/** Reacciones de Auth a eventos de otros módulos. */
@Injectable()
export class AuthEventsListener {
  constructor(private readonly tokens: AuthTokensService) {}

  /** Cambio de contraseña: se cierran todas las sesiones. Si falla, el cambio de contraseña falla. */
  @OnEvent(DomainEvents.PASSWORD_CHANGED, { suppressErrors: false })
  async onPasswordChanged(event: PasswordChangedEvent): Promise<void> {
    await this.tokens.revokeAllRefreshTokens(event.userId);
  }

  /** Cuenta suspendida: se cierran todas sus sesiones (el guard ya rechaza sus access tokens). */
  @OnEvent(DomainEvents.USER_SUSPENDED, { suppressErrors: false })
  async onUserSuspended(event: UserSuspendedEvent): Promise<void> {
    await this.tokens.revokeAllRefreshTokens(event.userId);
  }
}
