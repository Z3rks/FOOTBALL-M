import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber, percent } from "../format";
import AdminLayout from "./layout/AdminLayout";
import PageHeader from "./layout/PageHeader";
import { BarList, ChartCard, ColumnChart, PeriodSelector, SERIES, StackedBarList, TrendChart, type Period } from "./admin/charts";
import { useGamesInsights } from "./admin/data/useGamesInsights";
import StatRow from "./admin/StatRow";
import GameIcon from "./games/GameIcon";

interface AdminGamesScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

/** Cada idioma conserva su color aunque cambie cuál tiene más partidas. */
const LOCALE_COLOR: Record<string, string> = { en: SERIES[0], es: SERIES[1] };
const localeColor = (locale: string) => LOCALE_COLOR[locale] ?? SERIES[2];

/** AdminGamesScreen (RF-154 a RF-160): cómo se juega cada minijuego. */
export default function AdminGamesScreen({ onNavigate, onLogout }: AdminGamesScreenProps) {
  const { t } = useTranslation();
  const [days, setDays] = useState<Period>(30);
  const data = useGamesInsights(days);
  const { queries, totals } = data;
  const icon = (name: string) => <GameIcon icon={name} size="sm" />;
  const localeName = (locale: string) => t(`admin.games.locale.${locale}`, { defaultValue: locale });
  const localeShare = (sessions: number) => percent((sessions / Math.max(1, data.localeTotal)) * 100);

  return (
    <AdminLayout active="admin-games" onNavigate={onNavigate} onLogout={onLogout}>
      <PageHeader title={t("admin.games.title")} subtitle={t("admin.dashboard.gamesHint")} actions={<PeriodSelector value={days} onChange={setDays} />} />

      <div className="space-y-4">
        <StatRow
          stats={[
            { label: t("admin.games.completed"), value: queries.overview.data ? formatNumber(totals.completed) : "–" },
            { label: t("admin.games.abandonRate"), value: percent(totals.abandonRate) },
            { label: t("admin.games.avgAccuracy"), value: percent(totals.accuracy) },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {/* RF-154: ¿cuál se juega más? */}
          <ChartCard
            title={t("admin.games.plays")}
            question={t("admin.games.playsQ")}
            query={queries.overview}
            empty={totals.started === 0}
            table={{ columns: [t("admin.games.game"), t("admin.games.started")], rows: data.byPlays.map((g) => [g.name, g.completed + g.abandoned]) }}
          >
            <BarList rows={data.byPlays.map((g) => ({ key: g.gameId, label: g.name, icon: icon(g.icon), value: g.completed + g.abandoned }))} />
          </ChartCard>

          {/* RF-155: ¿cuál se abandona más? */}
          <ChartCard
            title={t("admin.games.abandon")}
            question={t("admin.games.abandonQ")}
            query={queries.overview}
            empty={data.byAbandon.length === 0}
            legend={[
              { label: t("admin.games.completedShort"), color: SERIES[0] },
              { label: t("admin.games.abandonedShort"), color: SERIES[1] },
            ]}
            table={{
              columns: [t("admin.games.game"), t("admin.games.completedShort"), t("admin.games.abandonedShort"), t("admin.games.abandonRate")],
              rows: data.byAbandon.map((g) => [g.name, g.completed, g.abandoned, percent(g.abandonRate)]),
            }}
          >
            <StackedBarList
              series={[t("admin.games.completedShort"), t("admin.games.abandonedShort")]}
              rows={data.byAbandon.map((g) => ({
                key: g.gameId,
                label: g.name,
                icon: icon(g.icon),
                values: [g.completed, g.abandoned],
                display: t("admin.games.abandonDisplay", { pct: percent(g.abandonRate) }),
              }))}
            />
          </ChartCard>

          {/* RF-156: ¿cuál es demasiado difícil o fácil? */}
          <ChartCard
            title={t("admin.games.accuracy")}
            question={t("admin.games.accuracyQ")}
            query={queries.overview}
            empty={data.byAccuracy.length === 0}
            table={{ columns: [t("admin.games.game"), t("stats.accuracy")], rows: data.byAccuracy.map((g) => [g.name, percent(g.accuracy)]) }}
          >
            <BarList
              max={100}
              rows={data.byAccuracy.map((g) => ({ key: g.gameId, label: g.name, icon: icon(g.icon), value: g.accuracy, display: percent(g.accuracy) }))}
              reference={totals.accuracy !== null ? { value: totals.accuracy, label: t("admin.games.averageLine", { value: percent(totals.accuracy) }) } : undefined}
            />
          </ChartCard>

          {/* RF-157: puntajes del minijuego elegido */}
          <ChartCard
            title={t("admin.games.scores")}
            question={t("admin.games.scoresQ")}
            query={queries.scores}
            empty={data.scoreData.every((s) => s.sessions === 0)}
            action={
              data.games.length > 0 && (
                <select
                  value={data.scoreGame}
                  onChange={(e) => data.setScoreGame(e.target.value)}
                  aria-label={t("admin.games.chooseGame")}
                  className="max-w-[130px] text-xs border border-border rounded-lg px-2 py-1 bg-white text-foreground"
                >
                  {data.games.map((g) => (
                    <option key={g.gameId} value={g.gameId}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )
            }
            table={{ columns: [t("admin.games.score"), t("admin.games.sessions")], rows: data.scoreData.map((s) => [`${s.score}/10`, s.sessions]) }}
          >
            <ColumnChart
              data={data.scoreData}
              x="score"
              series={[{ key: "sessions" }]}
              height={150}
              allTicks
              format={(v) => t("admin.games.sessionsCount", { count: v })}
              formatLabel={(score) => t("admin.games.scoreLabel", { score })}
            />
            <p className="text-[11px] text-muted-foreground text-center">{t("admin.games.scoreAxis")}</p>
          </ChartCard>

          {/* RF-158: preguntas con menos aciertos */}
          <ChartCard
            title={t("admin.games.hardest")}
            question={t("admin.games.hardestQ")}
            query={queries.hardest}
            empty={data.hardestQuestions.length === 0}
            table={{
              columns: [t("admin.games.question"), t("admin.games.answers"), t("admin.games.correctRate")],
              rows: data.hardestQuestions.map((q) => [`${q.gameName} · ${q.statement}`, q.answers, percent(q.correctRate)]),
            }}
          >
            <BarList
              max={100}
              rows={data.hardestQuestions.map((q, i) => ({
                key: q.questionId,
                label: `${i + 1}. ${q.statement}`,
                hint: [q.gameName, q.answer && t("admin.games.answerIs", { answer: q.answer }), t("admin.games.answersCount", { count: q.answers })].filter(Boolean).join(" · "),
                value: q.correctRate,
                display: percent(q.correctRate),
              }))}
            />
          </ChartCard>

          {/* RF-159: participación en el reto diario */}
          <ChartCard
            title={t("admin.games.daily")}
            question={t("admin.games.dailyQ")}
            query={queries.daily}
            empty={data.dailyData.every((d) => d.players === 0)}
            table={{ columns: [t("admin.charts.date"), t("admin.games.players")], rows: data.dailyData.map((d) => [d.label, d.players]) }}
          >
            <TrendChart data={data.dailyData} x="label" series={[{ key: "players" }]} dots={days === 7} format={(v) => t("admin.games.playersCount", { count: v })} />
          </ChartCard>

          {/* RF-160: idioma de las partidas */}
          <ChartCard
            title={t("admin.games.language")}
            question={t("admin.games.languageQ")}
            query={queries.overview}
            empty={data.localeTotal === 0}
            legend={data.locales.map((l) => ({ label: localeName(l.locale), color: localeColor(l.locale) }))}
            table={{ columns: [t("language.label"), t("admin.games.sessions"), "%"], rows: data.locales.map((l) => [localeName(l.locale), l.sessions, localeShare(l.sessions)]) }}
          >
            <div className="flex h-3 gap-0.5">
              {data.locales.map((l) => (
                <div
                  key={l.locale}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(l.sessions / Math.max(1, data.localeTotal)) * 100}%`, background: localeColor(l.locale) }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-foreground">
              {data.locales.map((l) => (
                <span key={l.locale}>
                  <b>{localeShare(l.sessions)}</b> <span className="text-muted-foreground">{localeName(l.locale)}</span>
                </span>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
}
