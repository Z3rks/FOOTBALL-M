import i18n, { numberLocale } from "./i18n";

/** Formatos de números y fechas usados en las pantallas, según el idioma elegido. */

export const formatNumber = (value: number | null | undefined) => (value ?? 0).toLocaleString(numberLocale());

/** 1_250 → "1.3k", 2_100_000 → "2.1M". */
export function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

/** "2h ago" / "hace 2 h"… (RF-067, RF-071). */
export function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return i18n.t("time.minutesAgo", { count: Math.max(minutes, 1) });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return i18n.t("time.hoursAgo", { count: hours });
  return i18n.t("time.daysAgo", { count: Math.round(hours / 24) });
}

/** Iniciales para el avatar: "FootballFan123" → "FO". */
export const initials = (name: string) => name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "FM";

/** Bandera emoji a partir de un código de país ISO ("CO" → 🇨🇴). */
export function flag(country: string | null): string {
  if (!country || !/^[A-Z]{2}$/.test(country)) return "🌍";
  return String.fromCodePoint(...[...country].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** "+8%", "-2%", "—" (sin base de comparación). */
export function formatChange(change: number | null, unit = "%"): string {
  if (change === null) return "—";
  return `${change > 0 ? "+" : ""}${change}${unit}`;
}

/** Mensaje motivacional según la precisión (RF-092). */
export function motivationalMessage(accuracy: number): string {
  if (accuracy === 100) return i18n.t("results.motivation.perfect");
  if (accuracy >= 80) return i18n.t("results.motivation.excellent");
  if (accuracy >= 60) return i18n.t("results.motivation.great");
  if (accuracy >= 40) return i18n.t("results.motivation.good");
  return i18n.t("results.motivation.keepPracticing");
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).replace(/\.$/, "");
const utcDate = (iso: string) => new Date(`${iso}T12:00:00Z`);

/** "2026-09-24" → "Thu" / "Jue". */
export const weekdayLabel = (date: string) => capitalize(utcDate(date).toLocaleDateString(numberLocale(), { weekday: "short", timeZone: "UTC" }));
/** "2026-09" → "Sep". */
export const monthLabel = (month: string) => capitalize(utcDate(`${month}-01`).toLocaleDateString(numberLocale(), { month: "short", timeZone: "UTC" }));
/** "2026-08" → "August 2026" / "Agosto 2026". */
export const monthLongLabel = (month: string) =>
  capitalize(utcDate(`${month}-01`).toLocaleDateString(numberLocale(), { month: "long", year: "numeric", timeZone: "UTC" }).replace(" de ", " "));

/** "24 sep" / "Sep 24": día y mes corto de una fecha YYYY-MM-DD, en el idioma de la app. */
export const shortDateLabel = (date: string) => utcDate(date).toLocaleDateString(numberLocale(), { day: "numeric", month: "short", timeZone: "UTC" });

/** Nombre del país (código ISO) en el idioma de la app. */
export function countryLabel(code: string): string {
  try {
    return new Intl.DisplayNames([numberLocale()], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** "83%" (redondeado) o "—" si todavía no hay dato. */
export const percent = (value: number | null | undefined) => (value === null || value === undefined ? "—" : `${Math.round(value)}%`);
