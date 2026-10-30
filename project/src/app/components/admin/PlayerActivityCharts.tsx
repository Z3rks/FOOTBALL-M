import { useTranslation } from "react-i18next";
import type { PlayerActivity } from "../../api/types";
import { formatNumber, percent, shortDateLabel } from "../../format";
import { BarList, ColumnChart } from "./charts";

/** "Ver perfil" en AdminUsersScreen (RF-174): XP de los últimos 30 días y precisión por categoría del jugador. */
export default function PlayerActivityCharts({ activity }: { activity: PlayerActivity }) {
  const { t } = useTranslation();
  const xpData = activity.dailyXp.map((d) => ({ ...d, label: shortDateLabel(d.date) }));
  const xpTotal = xpData.reduce((s, d) => s + d.xp, 0);
  const played = activity.accuracyByCategory.filter((c) => c.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
  const empty = <p className="text-[11px] text-muted-foreground">{t("admin.charts.empty")}</p>;

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
      <div>
        <p className="text-xs font-bold text-foreground">{t("admin.users.xp30")}</p>
        <p className="text-[11px] text-muted-foreground mb-1">{t("admin.users.xp30Q", { xp: formatNumber(xpTotal) })}</p>
        {xpTotal === 0 ? empty : <ColumnChart data={xpData} x="label" series={[{ key: "xp" }]} height={70} compact format={(v) => `${formatNumber(v)} XP`} />}
      </div>
      <div>
        <p className="text-xs font-bold text-foreground">{t("admin.users.accuracyByCategory")}</p>
        <p className="text-[11px] text-muted-foreground mb-2">{t("admin.users.accuracyByCategoryQ")}</p>
        {played.length === 0 ? (
          empty
        ) : (
          <BarList max={100} rows={played.map((c) => ({ key: c.category, label: t(`enums.category.${c.category}`, { defaultValue: c.category }), value: c.accuracy, display: percent(c.accuracy) }))} />
        )}
      </div>
    </div>
  );
}
