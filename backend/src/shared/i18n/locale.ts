import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Idiomas del contenido. El inglés es el idioma por defecto de la app. */
export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Textos de un registro en otros idiomas: { es: { name: "..." } }. Las columnas normales guardan
 * el texto en el idioma en que se escribió el contenido; aquí solo van las traducciones.
 */
export type Translations<T> = Partial<Record<Locale, Partial<T>>>;

/** Idioma pedido en la cabecera Accept-Language ("es-CO,es;q=0.9" → "es"); si no se reconoce, inglés. */
export function parseLocale(header: string | undefined | null): Locale {
  const first = (header ?? '').split(',')[0].trim().slice(0, 2).toLowerCase();
  return (LOCALES as readonly string[]).includes(first) ? (first as Locale) : DEFAULT_LOCALE;
}

/**
 * El registro con sus textos en `locale`. Si no hay traducción a ese idioma se deja el texto
 * original. Función pura: no toca la base de datos ni modifica el registro recibido.
 */
export function localize<T extends { translations?: Translations<object> | null }>(record: T, locale: Locale): T {
  const translated = record.translations?.[locale];
  return translated ? { ...record, ...translated } : record;
}

/** Idioma de la petición (cabecera Accept-Language). Uso: `method(@RequestLocale() locale: Locale)`. */
export const RequestLocale = createParamDecorator((_data: unknown, ctx: ExecutionContext): Locale => {
  const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
  return parseLocale(request.headers['accept-language']);
});
