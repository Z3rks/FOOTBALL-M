import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

/**
 * Configuración HTTP común. La usan main.ts y las pruebas e2e, para que las pruebas
 * ejerciten la misma app que corre en producción.
 */
/** TRUST_PROXY → número de proxies de confianza ("true" = 1, "false" o vacío = 0). */
export function trustedProxies(value: string | undefined): number {
  if (value === 'true') return 1;
  const count = Number(value);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

export function configureApp(app: NestExpressApplication): void {
  // Contrato de API §3: URL base /v1.
  app.setGlobalPrefix('v1');

  // Detrás de proxies (Render; o Vercel → Render) la IP real llega en X-Forwarded-For; sin esto,
  // el rate limiting vería a todos los usuarios con la IP del proxy. El número de proxies debe
  // ser exacto: si sobra, un cliente podría falsificar su IP.
  const proxies = trustedProxies(process.env.TRUST_PROXY);
  if (proxies > 0) app.set('trust proxy', proxies);

  // Plan de Seguridad A05: cabeceras de seguridad HTTP (Content-Security-Policy, X-Frame-Options,
  // Strict-Transport-Security, X-Content-Type-Options…) y sin X-Powered-By, que revelaría Express.
  app.use(helmet());

  // Plan de Seguridad §7: solo el frontend oficial (con cookies) y cuerpos de máximo 1 MB.
  // exposedHeaders: sin esto el navegador no deja leer el nombre de los CSV descargados.
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true, exposedHeaders: ['Content-Disposition'] });
  app.useBodyParser('json', { limit: '1mb' });
  app.use(cookieParser());

  // Plan de Seguridad §7: se rechazan campos no declarados en los DTO (ej. un "score" enviado por el cliente).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
}
