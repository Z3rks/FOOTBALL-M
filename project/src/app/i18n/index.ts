import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import es from "./es.json";

/**
 * Idiomas de la app. Inglés es el idioma por defecto y el de respaldo: si falta una traducción
 * al español, se muestra el texto en inglés. Los textos viven en en.json y es.json; las pantallas
 * solo usan claves (t("clave")).
 */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] as const;
export type Language = (typeof LANGUAGES)[number]["code"];
export const DEFAULT_LANGUAGE: Language = "en";

const STORAGE_KEY = "fm.language";

function savedLanguage(): Language {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.some((l) => l.code === value) ? (value as Language) : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: savedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false }, // React ya escapa los textos
  returnNull: false,
});
document.documentElement.lang = i18n.language;

export const currentLanguage = (): Language => (i18n.language === "es" ? "es" : "en");

/** Cambia el idioma de toda la app y lo recuerda en este navegador. */
export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language);
  document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* sin almacenamiento: el idioma dura hasta recargar */
  }
}

/** Configuración regional para fechas y números ("es" usa el formato colombiano). */
export const numberLocale = () => (currentLanguage() === "es" ? "es-CO" : "en-US");

export default i18n;
