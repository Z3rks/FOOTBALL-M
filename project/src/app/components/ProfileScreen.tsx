import { User, Trophy, Flame, Target, Award, TrendingUp, Settings, LogOut, ChevronRight } from "lucide-react";
import { usersApi } from "../api/api";
import { useApi } from "../api/hooks";
import { formatNumber, initials } from "../format";
import LoadState from "./LoadState";
import PlayerLayout from "./layout/PlayerLayout";
import { useTranslation } from "react-i18next";

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

/** Perfil del jugador (RF-104 a RF-113). */
export default function ProfileScreen({ onNavigate, onLogout }: ProfileScreenProps) {
  const { t } = useTranslation();
  const profile = useApi(usersApi.me);
  const stats = useApi(usersApi.stats);
  const me = profile.data;

  const summary = [
    { icon: Trophy, color: "text-accent", value: me?.level, label: t("profile.level") },
    { icon: Flame, color: "text-orange-500", value: me?.streakDays, label: t("profile.dayStreak") },
    { icon: Award, color: "text-primary", value: me?.badgesCount, label: t("stats.badges") },
  ];

  return (
    <PlayerLayout active="profile" onNavigate={onNavigate}>
      <LoadState loading={profile.loading && !me} error={profile.error} onRetry={profile.reload} />

      {/* En escritorio: identidad y menú a la izquierda, estadísticas a la derecha. En celular el menú va al final. */}
      <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr] items-start">
        {/* Identidad (RF-104, RF-105) */}
        <div className="lg:col-start-1 lg:row-start-1 bg-primary rounded-2xl px-4 py-6 shadow-md text-center">
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center font-bold text-3xl text-primary mb-3 shadow-lg mx-auto">
            {me ? initials(me.username) : "FM"}
          </div>
          <h1 className="text-white text-2xl font-bold break-words">{me?.username ?? "…"}</h1>
          <p className="text-white/80 text-sm break-all">{me?.email ?? ""}</p>
        </div>

        {/* Menú (RF-111 a RF-113) */}
        <div className="order-last lg:order-none lg:col-start-1 lg:row-start-2 bg-card border border-border rounded-xl overflow-hidden shadow-sm divide-y divide-border">
          <button onClick={() => onNavigate("account-settings")} className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("profile.accountSettings")}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => onNavigate("edit-profile")} className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("profile.editProfile")}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={onLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-600">{t("profile.logOut")}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-red-600" />
          </button>
        </div>

        <div className="lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-2 space-y-6">
          {/* Nivel, racha e insignias (RF-106) */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {summary.map(({ icon: Icon, color, value, label }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 md:p-6 text-center shadow-sm">
                <div className="flex justify-center mb-2">
                  <Icon className={`w-6 h-6 md:w-7 md:h-7 ${color}`} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{value ?? "–"}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Rendimiento (RF-107 a RF-110) */}
          <section>
            <h3 className="text-lg font-bold text-foreground mb-3">{t("profile.performance")}</h3>
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("stats.accuracy")}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.accuracyHint")}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary">{stats.data ? `${Math.round(stats.data.accuracy)}%` : "–"}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("stats.totalXp")}</p>
                    <p className="text-xs text-muted-foreground">
                      {me ? t("profile.xpToLevel", { xp: formatNumber(me.xpToNextLevel), level: me.level + 1 }) : t("profile.xpHint")}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.data ? formatNumber(stats.data.xpTotal) : "–"}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-chart-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("profile.gamesPlayed")}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.gamesPlayedHint")}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.data ? formatNumber(stats.data.gamesPlayed) : "–"}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PlayerLayout>
  );
}
