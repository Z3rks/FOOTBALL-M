import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dateInTimeZone } from './app-date';

/**
 * Fecha de hoy y zona horaria de la app (APP_TIMEZONE). El reto diario, la racha y las
 * métricas del panel cambian a la medianoche de esa zona, no a la medianoche UTC.
 */
@Injectable()
export class AppClock {
  readonly timeZone: string;

  constructor(config: ConfigService) {
    this.timeZone = config.getOrThrow<string>('APP_TIMEZONE');
  }

  /** Hoy, YYYY-MM-DD en APP_TIMEZONE. */
  today(): string {
    return dateInTimeZone(this.timeZone);
  }

  /** Día (YYYY-MM-DD en APP_TIMEZONE) de un instante. */
  dateOf(at: Date): string {
    return dateInTimeZone(this.timeZone, at);
  }
}

/** Provee AppClock a todos los módulos. */
@Global()
@Module({
  providers: [AppClock],
  exports: [AppClock],
})
export class TimeModule {}
