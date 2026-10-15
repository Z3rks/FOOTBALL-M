import { Injectable } from '@nestjs/common';
import { ActivityRepository } from './repositories/activity.repository';

/** Sin señales durante este tiempo, la siguiente actividad abre una sesión de uso nueva. */
export const SESSION_IDLE_MINUTES = 30;

/**
 * Registro de actividad (USER_SESSION), fuente de DAU/MAU, retención, duración de sesión y
 * pico por hora del panel administrativo. Solo guarda inicio y última actividad (Ley 1581:
 * minimización de datos; no se registran clics ni pantallas).
 */
@Injectable()
export class ActivityService {
  constructor(private readonly activity: ActivityRepository) {}

  /** POST /activity/heartbeat: extiende la sesión de uso abierta o empieza una nueva. */
  async heartbeat(userId: string): Promise<void> {
    if (!(await this.activity.extendOpenSession(userId, SESSION_IDLE_MINUTES))) {
      await this.activity.startSession(userId, new Date());
    }
  }
}
