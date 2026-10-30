import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { API_ERROR_KEYS } from "../i18n/apiErrors";
import { ApiError } from "./client";

/**
 * Carga datos de la API al montar la pantalla (y cuando cambian `deps` o el idioma: el contenido
 * que envía la API, como los minijuegos o la tienda, viene en el idioma elegido).
 * `reload()` vuelve a pedirlos, por ejemplo después de una compra.
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;
  const requestId = useRef(0);
  const { i18n: { language } } = useTranslation();

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loadRef.current();
      if (id === requestId.current) setData(result);
    } catch (e) {
      if (id === requestId.current) setError(errorMessage(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, language]);

  return { data, error, loading, reload, setData };
}

/** Mensaje en inglés que llegó de la API, sin traducir (para comparar con un error conocido). */
export function rawErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

/** Texto de error para mostrar al usuario, en su idioma (los errores desconocidos, tal cual). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.key) return i18n.t(error.key);
  const message = rawErrorMessage(error);
  const key = API_ERROR_KEYS[message];
  if (key) return i18n.t(key);
  return message || i18n.t("errors.generic");
}
