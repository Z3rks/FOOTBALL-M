import { Award, Target, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { gamesApi, newsApi, usersApi } from "../api/api";
import { useApi } from "../api/hooks";
import { formatNumber, percent, timeAgo } from "../format";
import LoadState from "./LoadState";
import GameIcon from "./games/GameIcon";
import PageHeader from "./layout/PageHeader";
import PlayerLayout from "./layout/PlayerLayout";

interface MainHomeScreenProps {
  onNavigate: (screen: string) => void;
  onPlayGame: (gameId: string, dailyChallenge?: boolean) => void;
}

/** Minijuegos y noticias que se muestran en el inicio (el resto, en sus pantallas). */
const HOME_GAMES = 5;
const HOME_NEWS = 3;

/** Inicio del jugador (RF-055 a RF-070). */
export default function MainHomeScreen({ onNavigate, onPlayGame }: MainHomeScreenProps) {
  const { t } = useTranslation();
  const profile = useApi(usersApi.me);
  const stats = useApi(usersApi.stats);
  const daily = useApi(gamesApi.dailyChallenge);
  const games = useApi(gamesApi.list);
  const news = useApi(() => newsApi.list({ category: "All" }, 1, HOME_NEWS));
  const me = profile.data;

  const seeAll = (screen: string) => (
    <button onClick={() => onNavigate(screen)} className="text-sm text-primary hover:text-secondary font-semibold">
      {t("common.seeAll")}
    </button>
  );

  return (
    <PlayerLayout active="home" onNavigate={onNavigate}>
      <PageHeader title={me ? t("home.greeting", { name: me.username }) : t("home.welcomeBack")} subtitle={t("home.subtitle")} />

      {/* Reto diario (RF-059 a RF-062) y estadísticas (RF-068) */}
      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <section className="lg:col-span-2 bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 md:p-8 shadow-lg flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-accent text-sm font-semibold mb-1">{t("home.dailyChallenge")}</p>
              <h2 className="text-white text-2xl md:text-3xl font-bold">{daily.data?.title ?? "Football Trivia Blitz"}</h2>
            </div>
            <span className="bg-accent text-primary text-sm font-bold px-3 py-1.5 rounded-full flex-shrink-0">+{daily.data?.xpReward ?? 50} XP</span>
          </div>
          <p className="text-white/90 mb-6 max-w-xl">{daily.data ? t("home.dailyText", { game: daily.data.game.name }) : t("home.dailyFallback")}</p>
          <button
            disabled={!daily.data || daily.data.completedToday}
            onClick={() => daily.data && onPlayGame(daily.data.game.id, true)}
            className="mt-auto self-start bg-accent text-primary px-8 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-md disabled:opacity-70"
          >
            {daily.data?.completedToday ? t("home.completedToday") : t("home.playNow")}
          </button>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">{t("home.myStats")}</h2>
          <ul className="space-y-4">
            {[
              { icon: Target, color: "text-primary", label: t("stats.accuracy"), value: stats.data ? percent(stats.data.accuracy) : "–" },
              { icon: Award, color: "text-accent", label: t("stats.badges"), value: stats.data ? String(stats.data.badgesCount) : "–" },
              { icon: TrendingUp, color: "text-chart-4", label: t("stats.totalXp"), value: stats.data ? formatNumber(stats.data.xpTotal) : "–" },
            ].map(({ icon: Icon, color, label, value }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </span>
                <span className="flex-1 text-sm text-muted-foreground">{label}</span>
                <span className="text-xl font-bold text-foreground">{value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Minijuegos (RF-063 a RF-066) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">{t("home.minigames")}</h2>
          {seeAll("minigames")}
        </div>
        <LoadState loading={games.loading} error={games.error} onRetry={games.reload} />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {games.data?.slice(0, HOME_GAMES).map((game) => (
            <button
              key={game.id}
              onClick={() => onPlayGame(game.id)}
              className="text-left bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <GameIcon icon={game.icon} className="mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">{game.name}</p>
              <span className="text-xs text-muted-foreground">{t(`enums.difficulty.${game.difficulty}`)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Últimas noticias (RF-067, RF-069, RF-070) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">{t("home.latestNews")}</h2>
          {seeAll("news")}
        </div>
        <LoadState loading={news.loading} error={news.error} onRetry={news.reload} />
        <div className="grid gap-4 md:grid-cols-3">
          {news.data?.data.map((article) => (
            <a
              key={article.id}
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {article.imageUrl && <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {article.source} • {timeAgo(article.publishedAt)}
                </p>
              </div>
            </a>
          ))}
        </div>
        {news.data && news.data.data.length === 0 && <p className="text-sm text-muted-foreground">{t("home.noNews")}</p>}
      </section>
    </PlayerLayout>
  );
}
