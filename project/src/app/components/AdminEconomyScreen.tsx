import { useState } from "react";
import { useTranslation } from "react-i18next";
import { compactNumber, formatNumber, percent } from "../format";
import AdminLayout from "./layout/AdminLayout";
import PageHeader from "./layout/PageHeader";
import { BarList, ChartCard, ColumnChart, PeriodSelector, SERIES, TrendChart, type Period } from "./admin/charts";
import { useEconomy } from "./admin/data/useEconomy";
import StatRow from "./admin/StatRow";

interface AdminEconomyScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

/** AdminEconomyScreen (RF-161 a RF-165): créditos, tienda e insignias. */
export default function AdminEconomyScreen({ onNavigate, onLogout }: AdminEconomyScreenProps) {
  const { t } = useTranslation();
  const [days, setDays] = useState<Period>(30);
  const data = useEconomy(days);
  const { queries } = data;
  const credits = (v: number) => t("admin.economy.creditsCount", { count: v, formatted: formatNumber(v) });
  const earned = t("admin.economy.earned");
  const spent = t("admin.economy.spent");

  return (
    <AdminLayout active="admin-economy" onNavigate={onNavigate} onLogout={onLogout}>
      <PageHeader title={t("admin.economy.title")} subtitle={t("admin.dashboard.economyHint")} actions={<PeriodSelector value={days} onChange={setDays} />} />

      <div className="space-y-4">
        <StatRow
          stats={[
            { label: earned, value: queries.flow.data ? compactNumber(data.earned) : "–" },
            { label: spent, value: queries.flow.data ? compactNumber(data.spent) : "–" },
            { label: t("admin.economy.inCirculation"), value: data.inCirculation === null ? "–" : compactNumber(data.inCirculation) },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {/* RF-161: ¿se acumulan créditos sin usar? */}
          <ChartCard
            title={t("admin.economy.flow")}
            question={t("admin.economy.flowQ")}
            query={queries.flow}
            empty={data.earned + data.spent === 0}
            legend={[
              { label: earned, color: SERIES[0] },
              { label: spent, color: SERIES[1] },
            ]}
            table={{ columns: [t("admin.charts.date"), earned, spent], rows: data.flowPoints.map((p) => [p.label, p.earned, p.spent]) }}
          >
            <ColumnChart
              data={data.flowPoints}
              x="label"
              series={[
                { key: "earned", name: earned },
                { key: "spent", name: spent },
              ]}
              height={160}
              format={formatNumber}
              formatY={compactNumber}
            />
          </ChartCard>

          {/* RF-162: ¿qué hábito premia más la app? */}
          <ChartCard
            title={t("admin.economy.reasons")}
            question={t("admin.economy.reasonsQ")}
            query={queries.reasons}
            empty={data.earnedByReasons === 0}
            table={{
              columns: [t("admin.economy.reason"), t("nav.credits"), "%"],
              rows: data.reasonRows.map((r) => [r.label, r.value, percent((r.value / Math.max(1, data.earnedByReasons)) * 100)]),
            }}
          >
            <BarList rows={data.reasonRows} />
          </ChartCard>

          {/* RF-164: créditos en manos de los jugadores */}
          <ChartCard
            title={t("admin.economy.circulation")}
            question={t("admin.economy.circulationQ")}
            query={queries.circulation}
            empty={data.circulationData.every((c) => c.credits === 0)}
            table={{ columns: [t("admin.charts.date"), t("nav.credits")], rows: data.circulationData.map((c) => [c.label, c.credits]) }}
          >
            <TrendChart data={data.circulationData} x="label" series={[{ key: "credits" }]} area format={credits} formatY={compactNumber} />
          </ChartCard>

          {/* RF-163: artículos más comprados */}
          <ChartCard
            title={t("admin.economy.items")}
            question={t("admin.economy.itemsQ")}
            query={queries.items}
            empty={data.items.every((i) => i.purchases === 0)}
            table={{ columns: [t("admin.economy.item"), t("admin.economy.purchases"), t("admin.economy.cost")], rows: data.items.map((i) => [i.name, i.purchases, i.cost]) }}
          >
            <BarList
              rows={data.items.map((i) => ({
                key: i.itemId,
                label: i.name,
                icon: <span aria-hidden>{i.icon}</span>,
                value: i.purchases,
                display: t("admin.economy.purchasesCount", { count: i.purchases }),
              }))}
            />
          </ChartCard>

          {/* RF-165: jugadores por insignia */}
          <ChartCard
            title={t("admin.economy.badges")}
            question={t("admin.economy.badgesQ")}
            query={queries.badges}
            empty={data.badges.length === 0}
            table={{ columns: [t("admin.economy.badge"), t("admin.games.players")], rows: data.badges.map((b) => [b.name, b.players]) }}
          >
            <BarList
              rows={data.badges.map((b) => ({
                key: b.code,
                label: b.name,
                icon: <span aria-hidden>{b.icon}</span>,
                value: b.players,
                display: t("admin.games.playersCount", { count: b.players }),
              }))}
            />
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
}
