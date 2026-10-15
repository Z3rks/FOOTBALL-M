import { ConfigService } from '@nestjs/config';
import { BREVO_SEND_URL, BrevoMailSender } from './brevo-mail-sender';

describe('BrevoMailSender', () => {
  const sender = new BrevoMailSender(
    new ConfigService({ MAIL_API_KEY: 'xkeysib-secreta', MAIL_FROM: 'equipo@gmail.com', MAIL_FROM_NAME: 'Football Maestro', PASSWORD_RESET_MINUTES: 30 }),
  );
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{"messageId":"1"}', { status: 201 }));
  });
  afterEach(() => fetchMock.mockRestore());

  it('envía el correo por la API de Brevo con la clave en el header', async () => {
    await sender.sendPasswordReset('fan@example.com', 'http://localhost:5173/reset-password?token=abc', 'en');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(BREVO_SEND_URL);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['api-key']).toBe('xkeysib-secreta');
    const body = JSON.parse(init.body as string);
    expect(body.sender).toEqual({ email: 'equipo@gmail.com', name: 'Football Maestro' });
    expect(body.to).toEqual([{ email: 'fan@example.com' }]);
    expect(body.textContent).toContain('http://localhost:5173/reset-password?token=abc');
    expect(body.htmlContent).toContain('href="http://localhost:5173/reset-password?token=abc"');
    expect(body.textContent).toContain('30 minutes');
  });

  it('envía el correo en el idioma pedido', async () => {
    await sender.sendPasswordReset('fan@example.com', 'http://x', 'es');
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.subject).toBe('Restablece tu contraseña de Football Maestro');
    expect(body.textContent).toContain('vence en 30 minutos');
    expect(body.htmlContent).toContain('Elegir una contraseña nueva');
  });

  it('escapa el enlace en el HTML', async () => {
    await sender.sendPasswordReset('fan@example.com', 'http://x/"><script>', 'en');
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.htmlContent).not.toContain('<script>');
    expect(body.htmlContent).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('falla con un error claro si Brevo rechaza el envío (clave inválida, remitente sin verificar…)', async () => {
    fetchMock.mockResolvedValue(new Response('{"code":"unauthorized"}', { status: 401 }));
    await expect(sender.sendPasswordReset('fan@example.com', 'http://x', 'en')).rejects.toThrow('Brevo respondió 401');
  });
});
