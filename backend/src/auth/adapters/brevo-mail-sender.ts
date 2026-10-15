import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Locale } from '../../shared/i18n/locale';
import { MailSender } from './mail-sender';
import { passwordResetEmail } from './password-reset-email';

/** Única URL a la que el adapter hace peticiones (Plan de Seguridad A10). */
export const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 10_000;

/**
 * Adapter de Brevo (https://www.brevo.com) para correos transaccionales. Plan gratuito:
 * 300 correos al día y, sin dominio propio, un remitente verificado (ej. un Gmail).
 * La clave va en el header api-key, nunca en la URL.
 */
@Injectable()
export class BrevoMailSender extends MailSender {
  private readonly apiKey: string;
  private readonly from: { email: string; name: string };
  private readonly resetMinutes: number;

  constructor(config: ConfigService) {
    super();
    this.apiKey = config.getOrThrow<string>('MAIL_API_KEY');
    this.from = { email: config.getOrThrow<string>('MAIL_FROM'), name: config.get<string>('MAIL_FROM_NAME') || 'Football Maestro' };
    this.resetMinutes = Number(config.get('PASSWORD_RESET_MINUTES'));
  }

  async sendPasswordReset(to: string, resetUrl: string, locale: Locale): Promise<void> {
    const email = passwordResetEmail(resetUrl, this.resetMinutes, locale);
    const response = await fetch(BREVO_SEND_URL, {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender: this.from, to: [{ email: to }], subject: email.subject, textContent: email.text, htmlContent: email.html }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Brevo respondió ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
}
