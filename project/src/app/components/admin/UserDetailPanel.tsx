import { useTranslation } from "react-i18next";
import type { AdminUser, AdminUserDetail, PlayerActivity } from "../../api/types";
import { flag, formatNumber, initials } from "../../format";
import { numberLocale } from "../../i18n";
import PlayerActivityCharts from "./PlayerActivityCharts";

interface UserDetailPanelProps {
  user: AdminUser;
  detail?: AdminUserDetail;
  activity?: PlayerActivity;
  busy: boolean;
  onViewProfile: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(numberLocale(), { day: "numeric", month: "short", year: "numeric" });

/** Acciones y perfil del jugador elegido en Usuarios (RF-135, RF-136 y RF-174). */
export default function UserDetailPanel({ user, detail, activity, busy, onViewProfile, onToggleStatus, onDelete }: UserDetailPanelProps) {
  const { t } = useTranslation();
  const active = user.status === "active";
  const button = "text-xs font-semibold py-2 px-1 rounded-lg bg-white border border-border hover:shadow-sm transition-all disabled:opacity-60";

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
          <span className="text-sm font-bold text-primary">{initials(user.username)}</span>
          <span className="absolute -bottom-0.5 -right-0.5 text-sm">{flag(user.country)}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground truncate">{user.username}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("admin.users.actions")}</p>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={onViewProfile} className={`${button} text-primary`}>
          {t("admin.users.viewProfile")}
        </button>
        <button disabled={busy} onClick={onToggleStatus} className={`${button} ${active ? "text-amber-600" : "text-emerald-600"}`}>
          {active ? t("admin.users.suspend") : t("admin.users.activate")}
        </button>
        <button disabled={busy} onClick={onDelete} className={`${button} text-red-500`}>
          {t("admin.users.delete")}
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span>{t("admin.users.registered", { date: formatDate(user.createdAt) })}</span>
        <span className="text-right">
          {t("admin.users.status")}{" "}
          <span className={`font-semibold ${active ? "text-emerald-600" : "text-gray-500"}`}>{active ? t("admin.users.active") : t("admin.users.inactive")}</span>
        </span>
      </div>

      {detail && (
        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-muted-foreground">
          <span>
            {t("admin.users.games")} <b className="text-foreground">{formatNumber(detail.gamesPlayed)}</b>
          </span>
          <span className="text-right">
            {t("admin.users.accuracy")} <b className="text-foreground">{Math.round(detail.accuracy)}%</b>
          </span>
          <span>
            {t("admin.users.badges")} <b className="text-foreground">{detail.badgesCount}</b>
          </span>
          <span className="text-right">
            {t("admin.users.credits")} <b className="text-foreground">{formatNumber(detail.creditsBalance)}</b>
          </span>
          <span className="col-span-2">
            {t("admin.users.lastActivity")} <b className="text-foreground">{detail.lastActiveAt ? formatDate(detail.lastActiveAt) : t("admin.users.noActivity")}</b>
          </span>
        </div>
      )}
      {activity && <PlayerActivityCharts activity={activity} />}
    </div>
  );
}
