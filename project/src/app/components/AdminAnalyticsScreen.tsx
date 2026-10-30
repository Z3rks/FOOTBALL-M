import { useState } from "react";
import { useTranslation } from "react-i18next";
import { flag, formatNumber, percent } from "../format";
import AdminLayout from "./layout/AdminLayout";
import PageHeader from "./layout/PageHeader";
import { BarList, ChartCard, ColumnChart, Funnel, Heatmap, PeriodSelector, SERIES, TrendChart, type Period } from "./admin/charts";
import { useAnalytics } from "./admin/data/useAnalytics";
import StatRow from "./admin/StatRow";

interface AdminAnalyticsScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

/** Clave de traducción de cada rango de duración de sesión. */
const DURATION_KEYS: Record<string, string> = { "<2m": "lt2", "2-5m": "2to5", "5-10m": "5to10", "10-20m": "10to20", ">20m": "gt20" };
/** Métodos de registro en orden fijo: cada uno conserva su color. */
const METHOD_COLORS = { email: SERIES[0], google: SERIES[1], both: SERIES[2] } as const;
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const HOURS = Array.from({ length: 24 }, (_, h) => `${h}h`);

/** Analytics (RF-138 a RF-145 y RF-166 a RF-172). */
export default function AdminAnalyticsScreen({ onNavigate, onLogout }: AdminAnalyticsScreenProps) {
  const { t } = useTranslation();
  const [days, setDays] = useState<Period>(30);
  const { queries, kpis, period, allTime } = useAnalytics(days);
  const players = (v: number) => t("admin.analytics.playersCount", { count: v });
  const weekdays = WEEKDAYS.map((d) => t(`admin.analytics.weekday.${d}`));
  const mostCommon = period.mostCommonDuration;
  const methodName = (method: string) => t(`admin.analytics.method.${method}`);
  const methodShare = (n: number) => percent((n / Math.max(1, allTime.methodTotal)) * 100);

  return (
    <AdminLayout active="admin-analytics" onNavigate={onNavigate} onLogout={onLogout}>
      <PageHeader title={t("adminNav.analytics")} subtitle={t("admin.dashboard.analyticsHint")} />

      <div className="space-y-4">
        {/* RF-138: últimos 30 días */}
        <StatRow
          stats={[
            { label: t("admin.analytics.avgSession"), value: kpis ? `${kpis.averageSessionMinutes}m` : "–" },
            { label: t("admin.analytics.retentionD7"), value: kpis ? percent(kpis.retentionD7) : "–" },
            { label: "DAU/MAU", value: kpis ? percent(kpis.dauMau) : "–" },
          ]}
        />

        {/* RF-166: el período afecta todas las gráficas hasta "De todos los tiempos" */}
        <div className="pt-2">
          <PeriodSelector value={days} onChange={setDays} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* RF-167 */}
          <ChartCard
            title={t("admin.analytics.signups")}
            question={t("admin.analytics.signupsQ", { count: period.signupTotal })}
            query={queries.signups}
            empty={period.signupTotal === 0}
            table={{ columns: [t("admin.charts.date"), t("admin.analytics.new")], rows: period.signupData.map((d) => [d.label, d.users]) }}
          >
            <ColumnChart data={period.signupData} x="label" series={[{ key: "users" }]} format={players} />
          </ChartCard>

          {/* RF-168 */}
          <ChartCard
            title={t("admin.analytics.funnelTitle")}
            question={t("admin.analytics.funnelQ")}
            query={queries.funnel}
            empty={(period.funnelSteps[0]?.value ?? 0) === 0}
            table={{
              columns: [t("admin.analytics.step"), t("admin.games.players"), "%"],
              rows: period.funnelSteps.map((s) => [s.label, s.value, percent((s.value / Math.max(1, period.funnelSteps[0]?.value ?? 1)) * 100)]),
            }}
          >
            <Funnel steps={period.funnelSteps} />
          </ChartCard>

          {/* RF-172: ocupa todo el ancho para que se lean las 24 horas */}
          <div className="lg:col-span-2">
            <ChartCard
              title={t("admin.analytics.heatmap")}
              question={t("admin.analytics.heatmapQ")}
              query={queries.heatmap}
              empty={period.heatCells.length === 0}
              table={{
                columns: [t("admin.analytics.weekdayCol"), t("admin.analytics.hourCol"), t("admin.analytics.sessions")],
                rows: [...period.heatCells].sort((a, b) => b.sessions - a.sessions).map((c) => [weekdays[c.weekday], `${c.hour}:00`, c.sessions]),
              }}
            >
              <Heatmap rows={weekdays} columns={HOURS} value={period.heat} format={(day, hour, count) => t("admin.analytics.heatCell", { day, hour, count })} />
            </ChartCard>
          </div>

          {/* RF-142 */}
          <ChartCard
            title={t("admin.analytics.gamesByCategory")}
            question={t("admin.analytics.gamesByCategoryQ")}
            query={queries.categories}
            empty={period.categoryRows.every((c) => c.games === 0)}
            table={{ columns: [t("admin.reports.category"), t("admin.reports.games")], rows: period.categoryRows.map((c) => [c.label, c.games]) }}
          >
            <BarList rows={period.categoryRows.map((c) => ({ key: c.category, label: c.label, value: c.games, display: formatNumber(c.games) }))} />
          </ChartCard>

          {/* RF-144 */}
          <ChartCard
            title={t("admin.analytics.accuracyByCategory")}
            question={t("admin.analytics.accuracyByCategoryQ")}
            query={queries.accuracy}
            empty={period.accuracyRows.length === 0}
            table={{ columns: [t("admin.reports.category"), t("stats.accuracy")], rows: period.accuracyRows.map((r) => [r.label, percent(r.accuracy)]) }}
          >
            <BarList
              max={100}
              rows={period.accuracyRows.map((r) => ({ key: r.category, label: r.label, value: r.accuracy, display: percent(r.accuracy) }))}
              reference={
                period.accuracyAverage !== null ? { value: period.accuracyAverage, label: t("admin.games.averageLine", { value: percent(period.accuracyAverage) }) } : undefined
              }
            />
          </ChartCard>

          {/* RF-143: el rango más común va en azul, el resto en gris */}
          <ChartCard
            title={t("admin.analytics.sessionLength")}
            question={
              mostCommon
                ? `${t("admin.analytics.mostCommon", { pct: period.durationBuckets.find((b) => b.range === mostCommon)?.pct })} ${t(`admin.analytics.range.${DURATION_KEYS[mostCommon]}`)}`
                : t("admin.analytics.sessionLengthQ")
            }
            query={queries.duration}
            empty={!mostCommon}
            table={{ columns: [t("admin.analytics.durationCol"), "%"], rows: period.durationBuckets.map((b) => [b.range, `${b.pct}%`]) }}
          >
            <ColumnChart
              data={period.durationBuckets}
              x="range"
              series={[{ key: "pct" }]}
              height={120}
              allTicks
              format={(v) => `${v}%`}
              highlight={(b) => b.range === mostCommon}
            />
          </ChartCard>

          <p className="lg:col-span-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-4">{t("admin.analytics.allTimeSection")}</p>

          {/* RF-139 */}
          <ChartCard
            title={t("admin.analytics.growth")}
            question={t("admin.analytics.growthHint")}
            query={queries.growth}
            empty={allTime.growthData.every((m) => m.active === 0 && m.new === 0)}
            legend={[
              { label: t("admin.analytics.active"), color: SERIES[0] },
              { label: t("admin.analytics.new"), color: SERIES[1] },
            ]}
            table={{
              columns: [t("admin.analytics.month"), t("admin.analytics.active"), t("admin.analytics.new")],
              rows: allTime.growthData.map((m) => [m.month, m.active, m.new]),
            }}
          >
            <TrendChart
              data={allTime.growthData}
              x="month"
              series={[
                { key: "active", name: t("admin.analytics.active") },
                { key: "new", name: t("admin.analytics.new") },
              ]}
              dots
            />
          </ChartCard>

          {/* RF-140 */}
          <ChartCard
            title={t("admin.analytics.retention")}
            question={t("admin.analytics.retentionHint")}
            query={queries.retention}
            empty={allTime.retentionData.every((r) => r.rate === null)}
            table={{ columns: [t("admin.analytics.dayCol"), t("admin.analytics.retentionShort")], rows: allTime.retentionData.map((r) => [r.label, percent(r.rate)]) }}
          >
            <TrendChart data={allTime.retentionData} x="label" series={[{ key: "rate" }]} height={130} dots yDomain={[0, 100]} yUnit="%" format={(v) => `${v}%`} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[1, 7, 30].map((day) => (
                <div key={day} className="bg-muted rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-foreground">{percent(allTime.retentionOn(day))}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.analytics.day", { n: day })}</p>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* RF-169 */}
          <ChartCard
            title={t("admin.analytics.countries")}
            question={t("admin.analytics.countriesQ")}
            query={queries.countries}
            empty={allTime.countryRows.length === 0}
            table={{ columns: [t("editProfile.country"), t("admin.games.players")], rows: allTime.countryRows.map((c) => [c.label, c.players]) }}
          >
            <BarList
              rows={allTime.countryRows.map((c) => ({
                key: c.country,
                label: c.label,
                icon: c.country.length === 2 ? <span aria-hidden>{flag(c.country)}</span> : undefined,
                value: c.players,
              }))}
            />
          </ChartCard>

          {/* RF-170 */}
          <ChartCard
            title={t("admin.analytics.methods")}
            question={t("admin.analytics.methodsQ")}
            query={queries.methods}
            empty={allTime.methodTotal === 0}
            legend={allTime.methods.map((m) => ({ label: methodName(m.method), color: METHOD_COLORS[m.method] }))}
            table={{
              columns: [t("admin.analytics.methodCol"), t("admin.games.players"), "%"],
              rows: allTime.methods.map((m) => [methodName(m.method), m.players, methodShare(m.players)]),
            }}
          >
            <div className="flex h-3 gap-0.5">
              {allTime.methods
                .filter((m) => m.players > 0)
                .map((m) => (
                  <div
                    key={m.method}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(m.players / allTime.methodTotal) * 100}%`, background: METHOD_COLORS[m.method] }}
                  />
                ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {allTime.methods.map((m) => (
                <div key={m.method} className="text-center">
                  <p className="text-sm font-bold text-foreground">{methodShare(m.players)}</p>
                  <p className="text-[11px] text-muted-foreground">{methodName(m.method)}</p>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* RF-171 */}
          <ChartCard
            title={t("admin.analytics.levels")}
            question={t("admin.analytics.levelsQ")}
            query={queries.levels}
            empty={allTime.levels.every((l) => l.players === 0)}
            table={{ columns: [t("profile.level"), t("admin.games.players")], rows: allTime.levels.map((l) => [l.range, l.players]) }}
          >
            <ColumnChart
              data={allTime.levels}
              x="range"
              series={[{ key: "players" }]}
              height={130}
              allTicks
              format={players}
              formatLabel={(level) => t("admin.analytics.levelLabel", { level })}
            />
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
}
