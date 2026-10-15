import { Locale } from '../../shared/i18n/locale';

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Textos del correo de recuperación en cada idioma. */
const TEXTS: Record<Locale, { subject: string; intro: string; linkLine: (minutes: number) => string; button: string; expiry: (minutes: number) => string; ignore: string }> = {
  en: {
    subject: 'Reset your Football Maestro password',
    intro: 'We received a request to reset your Football Maestro password.',
    linkLine: (minutes) => `Open this link to choose a new one (it expires in ${minutes} minutes and works only once):`,
    button: 'Choose a new password',
    expiry: (minutes) => `The link expires in ${minutes} minutes and works only once.`,
    ignore: "If you didn't ask for this, you can ignore this email: your password won't change.",
  },
  es: {
    subject: 'Restablece tu contraseña de Football Maestro',
    intro: 'Recibimos una solicitud para restablecer tu contraseña de Football Maestro.',
    linkLine: (minutes) => `Abre este enlace para elegir una nueva (vence en ${minutes} minutos y solo funciona una vez):`,
    button: 'Elegir una contraseña nueva',
    expiry: (minutes) => `El enlace vence en ${minutes} minutos y solo funciona una vez.`,
    ignore: 'Si no lo pediste, puedes ignorar este correo: tu contraseña no cambiará.',
  },
};

/**
 * Contenido del correo de recuperación de contraseña (RF-035 a RF-039) en el idioma de quien lo
 * pidió. No depende del proveedor de correo: cualquier MailSender lo puede enviar.
 */
export function passwordResetEmail(resetUrl: string, minutes: number, locale: Locale): EmailContent {
  const t = TEXTS[locale];
  const url = escapeHtml(resetUrl);
  return {
    subject: t.subject,
    text: [t.intro, t.linkLine(minutes), resetUrl, t.ignore].join('\n\n'),
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1a1a1a">
  <h2 style="color:#0f7a3d">⚽ Football Maestro</h2>
  <p>${t.intro}</p>
  <p style="margin:28px 0"><a href="${url}" style="background:#0f7a3d;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">${t.button}</a></p>
  <p style="font-size:13px;color:#555">${t.expiry(minutes)} ${t.ignore}</p>
  <p style="font-size:12px;color:#888;word-break:break-all">${url}</p>
</div>`,
  };
}
