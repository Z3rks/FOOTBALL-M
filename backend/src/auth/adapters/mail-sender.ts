import { Injectable, Logger } from '@nestjs/common';
import { Locale } from '../../shared/i18n/locale';

/** Puerto (Adapter): envío de correos transaccionales. */
export abstract class MailSender {
  /** Correo de recuperación en el idioma de quien lo pidió. */
  abstract sendPasswordReset(to: string, resetUrl: string, locale: Locale): Promise<void>;
}

/**
 * Implementación de desarrollo (sin MAIL_API_KEY): escribe el enlace en la consola en lugar de
 * enviar un correo. Con clave se usa BrevoMailSender; cambiar de proveedor es escribir otra
 * clase que implemente MailSender, sin tocar AuthService.
 */
@Injectable()
export class ConsoleMailSender extends MailSender {
  private readonly logger = new Logger('MailSender');

  async sendPasswordReset(to: string, resetUrl: string, locale: Locale): Promise<void> {
    this.logger.warn(`[DEV] Correo de recuperación (${locale}) para ${to}: ${resetUrl}`);
  }
}
