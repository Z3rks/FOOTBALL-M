import { ReactNode } from "react";
import { BarChart2, Coins, FileText, Gamepad2, LayoutDashboard, LogOut, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import TopNav from "./TopNav";

export type AdminSection = "admin-dashboard" | "admin-users" | "admin-games" | "admin-economy" | "admin-analytics" | "admin-reports";

interface AdminLayoutProps {
  active: AdminSection;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

/** Estructura de las pantallas del panel de administración en la app web: las 6 secciones arriba. */
export default function AdminLayout({ active, onNavigate, onLogout, children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const items = [
    { id: "admin-dashboard", label: t("adminNav.dashboard"), icon: LayoutDashboard },
    { id: "admin-users", label: t("adminNav.users"), icon: Users },
    { id: "admin-games", label: t("admin.games.title"), icon: Gamepad2 },
    { id: "admin-economy", label: t("admin.economy.title"), icon: Coins },
    { id: "admin-analytics", label: t("adminNav.analytics"), icon: BarChart2 },
    { id: "admin-reports", label: t("adminNav.reports"), icon: FileText },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-muted/40">
      <TopNav
        items={items}
        active={active}
        onNavigate={onNavigate}
        tone="secondary"
        badge={t("admin.portal")}
        right={
          <>
            <LanguageSwitcher />
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-white/80 text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("admin.logout")}</span>
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
