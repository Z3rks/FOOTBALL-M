/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API, ej. http://localhost:3000/v1 */
  readonly VITE_API_URL?: string;
  /** Client ID de Google (OAuth). Vacío = botón de Google deshabilitado. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
