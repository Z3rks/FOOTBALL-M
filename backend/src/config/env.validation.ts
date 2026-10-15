import { plainToInstance } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsTimeZone, IsUrl, Matches, Max, Min, MinLength, ValidateIf, validateSync } from 'class-validator';

/** Variables de entorno. La app no arranca si falta alguna obligatoria o es inválida. */
export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  /** Zona horaria en la que cambia el día (reto diario, racha). Nombre IANA, ej. America/Bogota. */
  @IsTimeZone()
  APP_TIMEZONE: string = 'America/Bogota';

  /**
   * Cuántos proxies hay delante de la API, para leer la IP real del cliente (ver app.setup.ts):
   * "false" = ninguno (desarrollo), "true" o "1" = uno (Render), "2" = dos (Vercel → Render).
   */
  @IsIn(['true', 'false', '1', '2', '3'])
  TRUST_PROXY: 'true' | 'false' | '1' | '2' | '3' = 'false';

  /** Origen permitido por CORS; debe incluir el protocolo (ej. http://localhost:5173). */
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  FRONTEND_URL: string;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  DB_USER: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  /** "true" para conectarse con SSL (obligatorio en Supabase); ver config/typeorm.config.ts. */
  @IsIn(['true', 'false'])
  DB_SSL: 'true' | 'false' = 'false';

  /** Certificado de la base de datos (opcional), para verificar el servidor además de cifrar. */
  @IsOptional()
  @IsString()
  DB_SSL_CA?: string;

  /** Firma de los access tokens. Mínimo 32 caracteres aleatorios. */
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  /** Duración del access token: número + unidad (s, m, h, d). Plan de Seguridad §5: 15–30 min. */
  @Matches(/^\d+[smhd]$/)
  JWT_EXPIRES_IN: string = '15m';

  @IsInt()
  @Min(1)
  @Max(90)
  REFRESH_TOKEN_DAYS: number = 7;

  @IsInt()
  @Min(5)
  @Max(120)
  PASSWORD_RESET_MINUTES: number = 30;

  /** Factor de costo de bcrypt (Plan de Seguridad §5: mínimo 10). */
  @IsInt()
  @Min(10)
  @Max(15)
  BCRYPT_COST: number = 12;

  /**
   * SameSite de la cookie del refresh token. "strict" funciona si frontend y API comparten
   * dominio (ej. app.footballmaestro.com y api.footballmaestro.com); si están en dominios
   * distintos (ej. vercel.app y onrender.com) se necesita "none" (requiere HTTPS).
   */
  @IsIn(['strict', 'lax', 'none'])
  COOKIE_SAMESITE: 'strict' | 'lax' | 'none' = 'strict';

  /** Si está vacío, el login con Google responde 503. */
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  /** Clave de Currents API. Si está vacía, el feed usa noticias de ejemplo. */
  @IsOptional()
  @IsString()
  NEWS_API_KEY?: string;

  /** Cada cuántos minutos se sincronizan las noticias; 0 la desactiva (pruebas). */
  @IsInt()
  @Min(0)
  @Max(1440)
  NEWS_SYNC_MINUTES: number = 120;

  /** Clave de Brevo. Si está vacía, el enlace de recuperación se escribe en la consola. */
  @IsOptional()
  @IsString()
  MAIL_API_KEY?: string;

  /** Remitente verificado en Brevo. Obligatorio si hay MAIL_API_KEY. */
  @ValidateIf((env: EnvironmentVariables) => !!env.MAIL_API_KEY)
  @IsEmail()
  MAIL_FROM?: string;

  @IsOptional()
  @IsString()
  MAIL_FROM_NAME?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const detail = errors.map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`).join('; ');
    throw new Error(`Variables de entorno inválidas: ${detail}`);
  }
  return env;
}
