import { AlertCircle, BarChart2, Coins, Flame, Gamepad2, RefreshCw, Target, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../api/api";
import { useApi } from "../api/hooks";
import type { KpiTrend } from "../api/types";
import { compactNumber, formatChange, formatNumber, percent, weekdayLabel } from "../format";
import { numberLocale } from "../i18n";
import { ChartCard, TrendChart } from "./admin/charts";
import KpiTile from "./admin/KpiTile";
import LoadState from "./LoadState";
import AdminLayout from "./layout/AdminLayout";
import PageHeader from "./layout/PageHeader";
import GameIcon from "./games/GameIcon";

interface AdminDashboardScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

/** Dashboard administrativo (RF-121 a RF-129, RF-173 y RF-175). */
export default function AdminDashboardScreen({ onNavigate, onLogout }: AdminDashboardScreenProps) {
  const { t } = useTranslation();
  const summary = useApi(adminApi.summary);
  const dau = useApi(adminApi.dau);
  const ranking = useApi(adminApi.ranking);
  const trends = useApi(adminApi.trends);

  const refresh = () => {
    void summary.reload();
    void dau.reload();
    void ranking.reload();
    void trends.reload();
  };

  const kpis = summary.data?.kpis;
  const trend = (pick: (d: KpiTrend) => number | null) => trends.data?.map(pick);
  const now = new Date(summary.data?.generatedAt ?? Date.now());
  const dauData = dau.data?.days.map((d) => ({ day: weekdayLabel(d.date), users: d.users })) ?? [];
  const weeklyChange = dau.data?.weeklyChange ?? null;
  const games = ranking.data ?? [];
  const maxPlays = Math.max(1, ...games.map((g) => g.plays));

  const quickAccess = [
    { label: t("adminNav.users"), hint: t("admin.dashboard.usersHint"), icon: Users, screen: "admin-users" },
    { label: t("admin.games.title"), hint: t("admin.dashboard.gamesHint"), icon: Gamepad2, screen: "admin-games" },
    { label: t("admin.economy.title"), hint: t("admin.dashboard.economyHint"), icon: Coins, screen: "admin-economy" },
    { label: t("adminNav.analytics"), hint: t("admin.dashboard.analyticsHint"), icon: BarChart2, screen: "admin-analytics" },
  ];

  return (
    <AdminLayout active="admin-dashboard" onNavigate={onNavigate} onLogout={onLogout}>
      {/* RF-121: fecha, hora, estado y actualizar */}
      <PageHeader
        title={t("admin.dashboard.overview")}
        subtitle={t("admin.dashboard.today", {
          date: now.toLocaleDateString(numberLocale(), { day: "numeric", month: "short", year: "numeric" }),
          time: now.toLocaleTimeString(numberLocale(), { hour: "2-digit", minute: "2-digit" }),
        })}
        actions={
          <>
            <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${summary.error ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
              <span className="text-xs font-semibold text-emerald-600">{summary.error ? t("admin.dashboard.offline") : t("admin.dashboard.online")}</span>
            </span>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${summary.loading ? "animate-spin" : ""}`} />
              {t("admin.refresh")}
            </button>
          </>
        }
      />

      <div className="space-y-6">
        <LoadState loading={false} error={summary.error} onRetry={refresh} />

        {/* RF-122: alertas del sistema */}
        {summary.data && summary.data.alerts.length > 0 && (
          <div className="space-y-2">
            {summary.data.alerts.map(({ type, code, values, message }, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs font-medium ${
                  type === "warn" ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-blue-50 border border-blue-200 text-blue-700"
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{t(`admin.alerts.${code}`, { ...values, defaultValue: message })}</span>
              </div>
            ))}
          </div>
        )}

        {/* RF-123 y RF-173: KPIs con su tendencia de 7 días */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiTile
            label={t("admin.dashboard.totalUsers")}
            kpi={kpis?.totalUsers}
            format={formatNumber}
            icon={Users}
            color="#1A5276"
            bg="bg-blue-50"
            trend={trend((d) => d.totalUsers)}
          />
          <KpiTile
            label={t("admin.dashboard.activeToday")}
            kpi={kpis?.activeToday}
            format={formatNumber}
            icon={Flame}
            color="#F0B429"
            bg="bg-amber-50"
            trend={trend((d) => d.activeUsers)}
          />
          <KpiTile
            label={t("admin.dashboard.gamesToday")}
            kpi={kpis?.gamesToday}
            format={formatNumber}
            icon={Gamepad2}
            color="#34d399"
            bg="bg-emerald-50"
            trend={trend((d) => d.games)}
          />
          <KpiTile
            label={t("admin.dashboard.avgAccuracy")}
            kpi={kpis?.averageAccuracy}
            unit=" pts"
            format={percent}
            icon={Target}
            color="#fb7185"
            bg="bg-red-50"
            trend={trend((d) => d.accuracy)}
          />
        </div>

        {/* RF-127, RF-128 y RF-175: Minijuegos y Economía se abren solo desde aquí */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickAccess.map(({ label, hint, icon: Icon, screen }) => (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 text-left shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-foreground">{label}</span>
                <span className="block text-[11px] text-muted-foreground leading-tight">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* RF-125: usuarios activos por día */}
          <ChartCard
            title={t("admin.dashboard.dau")}
            question={t("admin.dashboard.dauQ")}
            query={dau}
            empty={!dau.data}
            action={
              <span className={`text-xs font-semibold flex items-center gap-1 ${weeklyChange !== null && weeklyChange < 0 ? "text-red-500" : "text-emerald-600"}`}>
                {weeklyChange !== null && weeklyChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {t("admin.dashboard.thisWeek", { change: formatChange(weeklyChange) })}
              </span>
            }
            table={{ columns: [t("admin.charts.date"), t("admin.dashboard.activeToday")], rows: dauData.map((d) => [d.day, d.users]) }}
          >
            <TrendChart data={dauData} x="day" series={[{ key: "users" }]} area dots height={200} format={(v) => t("admin.games.playersCount", { count: v })} />
          </ChartCard>

          {/* RF-126: los 4 minijuegos más jugados */}
          <ChartCard
            title={t("admin.dashboard.ranking")}
            question={t("admin.dashboard.rankingQ")}
            query={ranking}
            empty={games.length === 0}
            table={{ columns: [t("admin.games.game"), t("admin.games.sessions"), t("admin.dashboard.avgScore")], rows: games.map((g) => [g.name, g.plays, g.avgScore]) }}
          >
            <div className="space-y-3">
              {games.map(({ gameId, name, icon, plays, avgScore, trend: direction }, i) => (
                <div key={gameId} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="flex items-center gap-2 min-w-0 text-xs font-semibold text-foreground">
                        <GameIcon icon={icon} size="sm" />
                        <span className="truncate">{name}</span>
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold ${direction === "up" ? "text-emerald-600" : direction === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                          {direction === "up" ? "▲" : direction === "down" ? "▼" : "•"} {avgScore}
                        </span>
                        <span className="text-xs text-muted-foreground">{compactNumber(plays)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(plays / maxPlays) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
}
