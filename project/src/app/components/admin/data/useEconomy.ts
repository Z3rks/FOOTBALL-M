import { useTranslation } from "react-i18next";
import { adminApi } from "../../../api/api";
import { useApi } from "../../../api/hooks";
import { formatNumber, shortDateLabel } from "../../../format";
import type { Period } from "../charts";

/** Datos de AdminEconomyScreen (RF-161 a RF-165), ya listos para dibujar. */
export function useEconomy(days: Period) {
  const { t } = useTranslation();
  const flow = useApi(() => adminApi.creditsFlow(days), [days]);
  const reasons = useApi(() => adminApi.creditReasons(days), [days]);
  const circulation = useApi(() => adminApi.creditsCirculation(days), [days]);
  const items = useApi(adminApi.itemPurchases);
  const badges = useApi(adminApi.badgeHolders);

  // Con 7 días el flujo va por día; con 30 y 90, por semana (la etiqueta dice "Sem …").
  const byWeek = flow.data?.granularity === "week";
  const flowPoints = (flow.data?.points ?? []).map((p) => ({ ...p, label: byWeek ? t("admin.economy.weekOf", { date: shortDateLabel(p.start) }) : shortDateLabel(p.start) }));
  const circulationData = (circulation.data ?? []).map((c) => ({ ...c, label: shortDateLabel(c.date) }));
  const reasonRows = (reasons.data ?? [])
    .map((r) => ({ key: r.reason, label: t(`credits.earn.${r.reason}`), value: r.credits, display: formatNumber(r.credits) }))
    .sort((a, b) => b.value - a.value);

  return {
    queries: { flow, reasons, circulation, items, badges },
    flowPoints,
    earned: flowPoints.reduce((s, p) => s + p.earned, 0),
    spent: flowPoints.reduce((s, p) => s + p.spent, 0),
    circulationData,
    /** Créditos en manos de los jugadores hoy (el último día de la serie). */
    inCirculation: circulationData.at(-1)?.credits ?? null,
    reasonRows,
    earnedByReasons: reasonRows.reduce((s, r) => s + r.value, 0),
    items: items.data ?? [],
    badges: badges.data ?? [],
  };
}
