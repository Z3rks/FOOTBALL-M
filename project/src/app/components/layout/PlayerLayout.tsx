import { ReactNode } from "react";
import { Brain, Coins, Flame, Home, Newspaper, Trophy, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usersApi } from "../../api/api";
import { useApi } from "../../api/hooks";
import { initials } from "../../format";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import TopNav from "./TopNav";

export type PlayerSection = "home" | "minigames" | "news" | "credits" | "profile";

interface PlayerLayoutProps {
  active: PlayerSection;
  onNavigate: (screen: string) => void;
  children: ReactNode;
}

/**
 * Estructura de las pantallas del jugador en la app web: barra superior con las secciones, su
 * nivel y racha, y el contenido centrado con un ancho cómodo de leer en escritorio.
 */
export default function PlayerLayout({ active, onNavigate, children }: PlayerLayoutProps) {
  const { t } = useTranslation();
  const profile = useApi(usersApi.me);
  const me = profile.data;

  const items = [
    { id: "home", label: t("nav.home"), icon: Home },
    { id: "minigames", label: t("nav.games"), icon: Brain },
    { id: "news", label: t("nav.news"), icon: Newspaper },
    { id: "credits", label: t("nav.credits"), icon: Coins },
    { id: "profile", label: t("nav.profile"), icon: User },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-muted/40">
      <TopNav
        items={items}
        active={active}
        onNavigate={onNavigate}
        right={
          <>
            {me && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-white text-sm font-semibold whitespace-nowrap">
                  <Trophy className="w-4 h-4 text-accent" />
                  {t("home.level", { level: me.level })}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-white text-sm font-semibold" title={t("profile.dayStreak")}>
                  <Flame className="w-4 h-4 text-accent" />
                  {me.streakDays}
                </span>
              </div>
            )}
            <LanguageSwitcher />
            <button
              onClick={() => onNavigate("profile")}
              className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-sm text-primary flex-shrink-0"
              aria-label={t("nav.profile")}
            >
              {me ? initials(me.username) : "FM"}
            </button>
          </>
        }
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
