import { useTranslation } from "react-i18next";
import { adminApi } from "../../../api/api";
import { useApi } from "../../../api/hooks";
import { countryLabel, monthLabel, shortDateLabel } from "../../../format";
import type { Period } from "../charts";

/**
 * Datos de AdminAnalyticsScreen (RF-138 a RF-145 y RF-166 a RF-172), ya listos para dibujar.
 * `period` agrupa las gráficas del período elegido y `allTime`, las de todos los tiempos.
 */
export function useAnalytics(days: Period) {
  const { t } = useTranslation();
  const category = (c: string) => t(`enums.category.${c}`, { defaultValue: c });

  const kpis = useApi(adminApi.analyticsKpis);
  // Del período
  const signups = useApi(() => adminApi.signups(days), [days]);
  const funnel = useApi(() => adminApi.funnel(days), [days]);
  const heatmap = useApi(() => adminApi.heatmap(days), [days]);
  const categories = useApi(() => adminApi.categories(days), [days]);
  const accuracy = useApi(() => adminApi.accuracyRadar(days), [days]);
  const duration = useApi(() => adminApi.sessionDuration(days), [days]);
  // De todos los tiempos
  const growth = useApi(adminApi.growth);
  const retention = useApi(adminApi.retention);
  const countries = useApi(adminApi.countries);
  const methods = useApi(adminApi.signupMethods);
  const levels = useApi(adminApi.levels);

  const signupData = (signups.data ?? []).map((d) => ({ ...d, label: shortDateLabel(d.date) }));
  const accuracyRows = (accuracy.data ?? []).filter((r) => r.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
  const funnelSteps = (funnel.data ?? []).map((s) => ({ key: s.step, label: t(`admin.analytics.funnel.${s.step}`), value: s.players }));
  const countryName = (c: string) => (c === "other" ? t("admin.analytics.otherCountries") : c === "unknown" ? t("admin.analytics.noCountry") : countryLabel(c));

  return {
    queries: { kpis, signups, funnel, heatmap, categories, accuracy, duration, growth, retention, countries, methods, levels },
    kpis: kpis.data,
    period: {
      signupData,
      signupTotal: signupData.reduce((s, d) => s + d.users, 0),
      funnelSteps,
      /** Sesiones de un día de la semana (0 = lunes) y hora. */
      heat: (weekday: number, hour: number) => heatmap.data?.find((c) => c.weekday === weekday && c.hour === hour)?.sessions ?? 0,
      heatCells: heatmap.data ?? [],
      categoryRows: [...(categories.data ?? [])].sort((a, b) => b.games - a.games).map((c) => ({ ...c, label: category(c.category) })),
      accuracyRows: accuracyRows.map((r) => ({ ...r, label: category(r.category) })),
      accuracyAverage: accuracyRows.length ? accuracyRows.reduce((s, r) => s + (r.accuracy ?? 0), 0) / accuracyRows.length : null,
      durationBuckets: duration.data?.buckets ?? [],
      mostCommonDuration: duration.data?.mostCommon ?? null,
    },
    allTime: {
      growthData: (growth.data ?? []).map((m) => ({ month: monthLabel(m.month), active: m.activeUsers, new: m.newUsers })),
      retentionData: (retention.data ?? []).map((r) => ({ ...r, label: t("admin.analytics.day", { n: r.day }) })),
      retentionOn: (day: number) => retention.data?.find((r) => r.day === day)?.rate ?? null,
      countryRows: (countries.data ?? []).map((c) => ({ ...c, label: countryName(c.country) })),
      methods: methods.data ?? [],
      methodTotal: (methods.data ?? []).reduce((s, m) => s + m.players, 0),
      levels: levels.data ?? [],
    },
  };
}
