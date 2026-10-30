import { useState } from "react";
import { CircleHelp, Download, Flame, Gamepad2, Medal, Minus, Timer, TrendingDown, TrendingUp, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../api/api";
import { errorMessage, useApi } from "../api/hooks";
import { compactNumber, flag, formatNumber, monthLongLabel } from "../format";
import AdminLayout from "./layout/AdminLayout";
import PageHeader from "./layout/PageHeader";
import LoadState from "./LoadState";
import { useTranslation } from "react-i18next";

/** Color de cada categoría en la tabla de rendimiento (RNF-UI de la maqueta de Reportes). */
const CATEGORY_COLORS: Record<string, string> = {
  Players: "#1A5276",
  Clubs: "#F0B429",
  History: "#34d399",
  Rules: "#60a5fa",
  Stadiums: "#a78bfa",
  Transfers: "#fb7185",
  Logic: "#f97316",
  Teams: "#14b8a6",
};

interface AdminReportsScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

/** Oro, plata y bronce para los 3 primeros del top (RNF-UI-091): color del ícono, de su fondo y de la barra. */
const MEDALS: Record<number, { color: string; bg: string }> = {
  1: { color: "#F0B429", bg: "bg-amber-50" },
  2: { color: "#9ca3af", bg: "bg-gray-100" },
  3: { color: "#b45309", bg: "bg-orange-50" },
};

/** Los últimos 12 meses (YYYY-MM), del actual hacia atrás, para "Cambiar mes" (RF-149). */
function lastMonths(count = 12): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

/** Reportes mensuales (RF-146 a RF-153). */
export default function AdminReportsScreen({ onNavigate, onLogout }: AdminReportsScreenProps) {
  const { t } = useTranslation();
  const months = lastMonths();
  const [month, setMonth] = useState(months[0]);
  const [exporting, setExporting] = useState(false);

  const summary = useApi(() => adminApi.reportSummary(month), [month]);
  const top = useApi(() => adminApi.topPlayers(month), [month]);
  const categories = useApi(() => adminApi.categoryPerformance(month), [month]);
  const peak = useApi(() => adminApi.peakHours(month), [month]);

  const metrics = summary.data?.keyMetrics;
  const weeks = summary.data?.weeks ?? [];
  const leaderXp = Math.max(1, ...(top.data?.map((p) => p.xp) ?? []));
  const hours = peak.data?.hours ?? [];
  const maxSessions = Math.max(1, ...hours.map((h) => h.sessions));
  const peakHour = peak.data?.peakHour ?? null;

  // RF-152/RF-153: descarga el CSV sin salir de la pantalla.
  const exportCsv = async () => {
    setExporting(true);
    try {
      await adminApi.exportReport(month);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout active="admin-reports" onNavigate={onNavigate} onLogout={onLogout}>
      {/* Período (RF-146, RF-149) y descarga (RF-152, RF-153) */}
      <PageHeader
        title={t("admin.reports.title", { month: monthLongLabel(month) })}
        subtitle={t("admin.reports.subtitle")}
        actions={
          <>
            <label className="relative text-xs font-semibold text-primary bg-card border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors cursor-pointer">
              {t("admin.reports.changeMonth")}
              <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label={t("admin.reports.changeMonth")} className="absolute inset-0 opacity-0 cursor-pointer">
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLongLabel(m)}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-secondary transition-colors disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? t("admin.reports.exporting") : t("admin.reports.exportFull")}
            </button>
          </>
        }
      />

      <div className="space-y-4">
        <LoadState loading={summary.loading && !summary.data} error={summary.error} onRetry={summary.reload} />

        {/* Métricas clave (RF-147) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: t("admin.reports.totalGames"),
              value: metrics ? formatNumber(metrics.totalGames) : "–",
              sub: t("admin.reports.allTime"),
              icon: Gamepad2,
              color: "#1A5276",
              bg: "bg-blue-50",
            },
            {
              label: t("admin.reports.avgDuration"),
              value: metrics ? `${metrics.averageSessionMinutes} min` : "–",
              sub: t("admin.reports.thisMonth"),
              icon: Timer,
              color: "#0d9488",
              bg: "bg-teal-50",
            },
            {
              label: t("admin.reports.questionsAnswered"),
              value: metrics ? compactNumber(metrics.questionsAnswered) : "–",
              sub: t("admin.reports.allTime"),
              icon: CircleHelp,
              color: "#e11d48",
              bg: "bg-rose-50",
            },
            {
              label: t("admin.reports.avgDailyXp"),
              value: metrics ? `${formatNumber(metrics.averageDailyXpPerActiveUser)} XP` : "–",
              sub: t("admin.reports.perActiveUser"),
              icon: Zap,
              color: "#d97706",
              bg: "bg-amber-50",
            },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3.5 shadow-sm">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className="w-5 h-5" style={{ color }} aria-hidden />
              </span>
              <p className="text-xl font-bold text-foreground mt-2">{value}</p>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Snapshots semanales (RF-148) */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">{t("admin.reports.weekly")}</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-4 gap-1 pb-2 border-b border-border">
                {[t("admin.reports.week"), t("adminNav.users"), t("admin.reports.games"), t("stats.totalXp")].map((h) => (
                  <p key={h} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </p>
                ))}
              </div>
              {weeks.map(({ label, week, users, games, xp, current }) => (
                <div key={label} className={`grid grid-cols-4 gap-1 py-2.5 border-b border-border/50 last:border-0 ${current ? "bg-primary/5 -mx-4 px-4 rounded-b-2xl" : ""}`}>
                  <p className="text-xs font-semibold text-foreground">{t("admin.reports.weekLabel", { n: week })}</p>
                  <p className="text-xs text-muted-foreground">{compactNumber(users)}</p>
                  <p className="text-xs text-muted-foreground">{compactNumber(games)}</p>
                  <p className="text-xs font-semibold text-primary">{compactNumber(xp)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top performers (RF-150) */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-foreground">{t("admin.reports.topPlayers")}</h3>
            </div>
            <LoadState loading={top.loading && !top.data} error={top.error} onRetry={top.reload} />
            {top.data?.length === 0 && <p className="text-xs text-muted-foreground">{t("admin.reports.nobodyPlayed")}</p>}
            <div className="space-y-3">
              {top.data?.map(({ rank, userId, username, xp, country, accuracy }) => {
                const medal = MEDALS[rank];
                return (
                  <div key={userId} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${medal ? medal.bg : "bg-muted text-xs font-bold text-muted-foreground"}`}
                      aria-label={t("admin.reports.rank", { rank })}
                    >
                      {medal ? <Medal className="w-5 h-5" style={{ color: medal.color }} aria-hidden /> : rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{username ?? t("admin.reports.deletedAccount")}</p>
                          <span className="text-sm">{flag(country)}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{accuracy === null ? "—" : `${Math.round(accuracy)}%`}</span>
                          <p className="text-xs font-bold text-primary">{formatNumber(xp)} XP</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(xp / leaderXp) * 100}%`, background: medal?.color ?? "#1A5276" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rendimiento por categoría (RF-151) */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">{t("admin.reports.byCategory")}</h3>
            <LoadState loading={categories.loading && !categories.data} error={categories.error} onRetry={categories.reload} />
            <div>
              <div className="grid grid-cols-4 gap-1 pb-2 border-b border-border">
                {[t("admin.reports.category"), t("admin.reports.games"), t("admin.reports.accuracyShort"), ""].map((h) => (
                  <p key={h} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </p>
                ))}
              </div>
              {categories.data?.map(({ category, games, accuracy, trend }) => {
                const color = CATEGORY_COLORS[category] ?? "#1A5276";
                return (
                  <div key={category} className="grid grid-cols-4 gap-1 items-center py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-1.5 col-span-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <p className="text-xs font-medium text-foreground truncate">{t(`enums.category.${category}`, { defaultValue: category })}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{compactNumber(games)}</p>
                    <p className="text-xs font-bold" style={{ color }}>
                      {accuracy === null ? "—" : `${Math.round(accuracy)}%`}
                    </p>
                    <div className="flex justify-end">
                      {trend === "up" ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      ) : trend === "down" ? (
                        <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actividad por hora del día (RF-152) */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-1">{t("admin.reports.peak")}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t("admin.reports.peakHint")}</p>
            <LoadState loading={peak.loading && !peak.data} error={peak.error} onRetry={peak.reload} />
            <div className="flex items-end gap-0.5 h-14">
              {hours.map(({ hour, sessions }) => {
                const isPeak = peakHour !== null && Math.abs(hour - peakHour) <= 1;
                return (
                  <div
                    key={hour}
                    className="flex-1 rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max(4, (sessions / maxSessions) * 100)}%`,
                      background: isPeak ? "#F0B429" : "rgba(26,82,118,0.3)",
                    }}
                    title={t("admin.reports.hourTitle", { hour, count: sessions })}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">00:00</span>
              {peakHour === null ? (
                <span className="text-xs text-muted-foreground">{t("admin.users.noActivity")}</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-accent font-semibold">
                  <Flame className="w-3.5 h-3.5" aria-hidden />
                  {t("admin.reports.peakAt", { from: peakHour, to: peakHour + 1 })}
                </span>
              )}
              <span className="text-xs text-muted-foreground">23:00</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
