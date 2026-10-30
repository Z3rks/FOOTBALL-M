import { useEffect, useState } from "react";
import { Search, Download, ChevronRight, Circle, Flame, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../api/api";
import { errorMessage, useApi } from "../api/hooks";
import type { AdminUser, AdminUserDetail, PlayerActivity, PlayerFilter } from "../api/types";
import { flag, formatNumber, initials } from "../format";
import UserDetailPanel from "./admin/UserDetailPanel";
import AdminLayout from "./layout/AdminLayout";
import PageHeader from "./layout/PageHeader";
import LoadState from "./LoadState";
import { useTranslation } from "react-i18next";

interface AdminUsersScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

const FILTER_LABELS: Array<[PlayerFilter, string]> = [
  ["all", "admin.users.filter.all"],
  ["active", "admin.users.filter.active"],
  ["inactive", "admin.users.filter.inactive"],
  ["new7d", "admin.users.filter.new7d"],
];
/** Espera tras la última tecla antes de buscar (RNF-PERF-03: resultados en menos de 1 s). */
const SEARCH_DEBOUNCE_MS = 300;

/** Gestión de usuarios (RF-130 a RF-137). */
export default function AdminUsersScreen({ onNavigate, onLogout }: AdminUsersScreenProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PlayerFilter>("all");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, AdminUserDetail>>({});
  const [activities, setActivities] = useState<Record<string, PlayerActivity>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const users = useApi(() => adminApi.users(filter, query), [filter, query]);
  const list = users.data?.data ?? [];

  // RF-135/RF-137: tocar la tarjeta abre o cierra su panel de acciones (a la derecha en escritorio, debajo en celular).
  const toggle = (id: string) => setSelectedUser(selectedUser === id ? null : id);

  const viewProfile = async (user: AdminUser) => {
    try {
      const [detail, activity] = await Promise.all([adminApi.user(user.id), adminApi.playerActivity(user.id)]);
      setDetails((current) => ({ ...current, [user.id]: detail }));
      setActivities((current) => ({ ...current, [user.id]: activity }));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const toggleStatus = async (user: AdminUser) => {
    const next = user.status === "active" ? "inactive" : "active";
    if (next === "inactive" && !window.confirm(t("admin.users.confirmSuspend", { user: user.username }))) return;
    setBusy(true);
    try {
      await adminApi.setUserStatus(user.id, next);
      toast.success(t(next === "inactive" ? "admin.users.suspended" : "admin.users.activated", { user: user.username }));
      await users.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (user: AdminUser) => {
    if (!window.confirm(t("admin.users.confirmDelete", { user: user.username }))) return;
    setBusy(true);
    try {
      await adminApi.deleteUser(user.id);
      toast.success(t("admin.users.deleted", { user: user.username }));
      setSelectedUser(null);
      await users.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // RF-132: exporta la lista con el filtro y la búsqueda actuales.
  const exportCsv = async () => {
    try {
      await adminApi.exportUsers(filter, query);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const selected = list.find((u) => u.id === selectedUser);
  const panel = selected && (
    <UserDetailPanel
      user={selected}
      detail={details[selected.id]}
      activity={activities[selected.id]}
      busy={busy}
      onViewProfile={() => viewProfile(selected)}
      onToggleStatus={() => toggleStatus(selected)}
      onDelete={() => remove(selected)}
    />
  );

  return (
    <AdminLayout active="admin-users" onNavigate={onNavigate} onLogout={onLogout}>
      <PageHeader
        title={t("admin.users.title")}
        subtitle={
          users.data && users.data.total > list.length
            ? t("admin.users.shownOf", { shown: list.length, total: formatNumber(users.data.total) })
            : t("admin.users.shown", { count: list.length })
        }
        actions={
          // RF-132: exporta la lista con el filtro y la búsqueda actuales
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold text-primary hover:bg-muted transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t("admin.users.export")}
          </button>
        }
      />

      {/* Buscador (RF-130, RF-133) y filtros con conteo (RF-131) */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 md:w-96 focus-within:border-primary/50">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder={t("admin.users.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground" aria-label={t("admin.users.clearSearch")}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 md:pb-0">
          {FILTER_LABELS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === key ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:bg-primary/10"
              }`}
            >
              {t(label)} · {formatNumber(users.data?.counts[key] ?? 0)}
            </button>
          ))}
        </div>
      </div>

      <LoadState loading={users.loading && !users.data} error={users.error} onRetry={users.reload} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        {/* Lista de usuarios (RF-134) */}
        <div className="space-y-2">
          {list.map((user) => (
            <div key={user.id}>
              <button
                onClick={() => toggle(user.id)}
                className={`w-full text-left bg-card border rounded-xl p-3.5 flex items-center gap-3 shadow-sm hover:border-primary/30 transition-all ${
                  selectedUser === user.id ? "border-primary ring-1 ring-primary/30" : "border-border"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                  <span className="text-sm font-bold text-primary">{initials(user.username)}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 text-sm">{flag(user.country)}</span>
                </div>
                <div className="flex-1 min-w-0 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-foreground truncate">{user.username}</p>
                      <Circle className={`w-2 h-2 flex-shrink-0 ${user.status === "active" ? "fill-emerald-400 text-emerald-400" : "fill-gray-300 text-gray-300"}`} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 sm:mt-0">
                    <span className="text-xs text-muted-foreground">
                      {t("admin.users.levelShort")} <span className="font-bold text-foreground">{user.level}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground" title={t("profile.dayStreak")}>
                      <Flame className="w-3.5 h-3.5 text-orange-500" aria-hidden />
                      <span className="font-bold text-foreground">{user.streakDays}d</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{formatNumber(user.xpTotal)} XP</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${selectedUser === user.id ? "rotate-90 lg:rotate-0" : ""}`} />
              </button>
              {/* En celular el panel se abre debajo del jugador */}
              {selectedUser === user.id && <div className="lg:hidden mt-2">{panel}</div>}
            </div>
          ))}

          {users.data && list.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{t("admin.users.noResults")}</p>
              <p className="text-xs mt-1">{t("admin.users.tryAnother")}</p>
            </div>
          )}
        </div>

        {/* En escritorio el panel queda fijo a la derecha */}
        <aside className="hidden lg:block sticky top-0">
          {panel ?? <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">{t("admin.users.selectHint")}</div>}
        </aside>
      </div>
    </AdminLayout>
  );
}
