/**
 * Cliente HTTP de la API de Football Maestro (Contrato de API §3).
 *
 * - El access token vive SOLO en memoria (nunca en localStorage: Plan de Seguridad §5, robo por XSS).
 * - El refresh token lo maneja el navegador en una cookie httpOnly; por eso todas las peticiones
 *   van con `credentials: "include"`.
 * - Si una petición responde 401, se renueva la sesión una vez (POST /auth/refresh) y se reintenta.
 */
/**
 * En desarrollo la API corre en localhost:3000. En producción el frontend la llama por su mismo
 * dominio (/v1): Vercel reenvía esas peticiones al backend (vercel.json), así la cookie de sesión
 * es del mismo sitio y no hace falta CORS.
 */
export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/v1" : "http://localhost:3000/v1")).replace(/\/$/, "");

import { currentLanguage } from "../i18n";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Clave de traducción para errores que genera el propio cliente (sin conexión, 429). */
    public readonly key?: string,
  ) {
    super(message);
  }
}

export interface SessionUser {
  id: string;
  username: string;
  role: "player" | "admin";
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}

let accessToken: string | null = null;
let refreshing: Promise<AuthResponse | null> | null = null;
let sessionLostHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Se llama cuando la sesión ya no se puede renovar (ej. expiró o la cuenta fue suspendida). */
export function onSessionLost(handler: () => void): void {
  sessionLostHandler = handler;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** false para endpoints públicos: no se reintenta con refresh en un 401. */
  auth?: boolean;
}

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`;
}

async function errorFrom(response: Response): Promise<ApiError> {
  let message = response.statusText || "Request failed";
  try {
    const body = await response.json();
    // Los errores de validación llegan como lista de mensajes.
    message = Array.isArray(body.message) ? body.message.join(". ") : (body.message ?? message);
  } catch {
    /* respuesta sin JSON */
  }
  if (response.status === 429) return new ApiError(429, "Too many attempts. Please wait a few minutes and try again.", "errors.tooManyRequests");
  return new ApiError(response.status, message);
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  // Accept-Language: la API responde el contenido en el idioma elegido (inglés por defecto).
  const headers: Record<string, string> = { Accept: "application/json", "Accept-Language": currentLanguage() };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection.", "errors.network");
  }
}

/**
 * Renueva la sesión con la cookie de refresh. Si varias peticiones fallan a la vez con 401,
 * todas esperan la misma renovación.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (async () => {
    try {
      const response = await rawFetch("/auth/refresh", { method: "POST", auth: false });
      if (!response.ok) {
        setAccessToken(null);
        return null;
      }
      const session = (await response.json()) as AuthResponse;
      setAccessToken(session.accessToken);
      return session;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  let response = await rawFetch(path, options);
  if (response.status === 401 && options.auth !== false) {
    const renewed = await refreshSession();
    if (renewed) {
      response = await rawFetch(path, options);
    } else {
      sessionLostHandler?.();
    }
  }
  // Cuenta suspendida mientras la sesión estaba abierta.
  if (response.status === 403 && options.auth !== false) {
    const error = await errorFrom(response.clone());
    if (error.message === "Account suspended") sessionLostHandler?.();
  }
  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  if (!response.ok) throw await errorFrom(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Descarga un archivo (ej. CSV) usando el access token y lo guarda con su nombre. */
export async function download(path: string, query: Query, fallbackName: string): Promise<void> {
  const response = await send(buildUrl(path, query).slice(API_URL.length), {});
  if (!response.ok) throw await errorFrom(response);
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
