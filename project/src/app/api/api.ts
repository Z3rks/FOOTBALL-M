import { AuthResponse, download, request, setAccessToken } from "./client";
import type {
  AdminUserDetail,
  AdminUsersPage,
  AnswerResult,
  CategoryPerformance,
  DailyChallenge,
  DashboardSummary,
  EarnMethod,
  Game,
  GameRanking,
  NewsArticle,
  NewsFilters,
  Page,
  PlayerFilter,
  PlayerStats,
  Profile,
  ReportSummary,
  SessionResult,
  StartedSession,
  StoreItem,
  TopPlayer,
  CreditsFlow,
  EarnReason,
  GamesOverview,
  HardQuestion,
  ItemPurchases,
  KpiTrend,
  PlayerActivity,
} from "./types";

/** Guarda el access token de una respuesta de login/registro. */
async function withSession(promise: Promise<AuthResponse>): Promise<AuthResponse> {
  const session = await promise;
  setAccessToken(session.accessToken);
  return session;
}

/** Contrato de API §4 — Auth. */
export const authApi = {
  login: (email: string, password: string, role: "player" | "admin") =>
    withSession(request<AuthResponse>("/auth/login", { method: "POST", body: { email, password, role }, auth: false })),
  register: (username: string, email: string, password: string, consentAccepted: boolean) =>
    withSession(request<AuthResponse>("/auth/register", { method: "POST", body: { username, email, password, consentAccepted }, auth: false })),
  google: (idToken: string, consentAccepted?: boolean) =>
    withSession(request<AuthResponse>("/auth/login/google", { method: "POST", body: { idToken, consentAccepted }, auth: false })),
  forgotPassword: (email: string) => request<void>("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (token: string, newPassword: string) => request<void>("/auth/reset-password", { method: "POST", body: { token, newPassword }, auth: false }),
  logout: async () => {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
    }
  },
};

/** Contrato de API §5 — Users. */
export const usersApi = {
  me: () => request<Profile>("/users/me"),
  stats: () => request<PlayerStats>("/users/me/stats"),
  heartbeat: () => request<void>("/activity/heartbeat", { method: "POST" }),
  /** "Edit Profile" (RF-112). country: código ISO de 2 letras o null para quitarlo. */
  updateProfile: (changes: { username?: string; country?: string | null }) => request<Profile>("/users/me", { method: "PATCH", body: changes }),
  /** "Account Settings" (RF-112). Cierra todas las sesiones de la cuenta. */
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/users/me/password", { method: "PATCH", body: { currentPassword, newPassword } }),
  /** Derecho de supresión (Ley 1581). password es obligatoria si la cuenta tiene contraseña. */
  deleteAccount: (password?: string) => request<void>("/users/me", { method: "DELETE", body: password ? { password } : {} }),
};

/** Contrato de API §7 — Games. */
export const gamesApi = {
  list: () => request<Game[]>("/games"),
  dailyChallenge: () => request<DailyChallenge>("/games/daily-challenge"),
  start: (gameId: string, dailyChallenge = false) => request<StartedSession>(`/games/${gameId}/sessions`, { method: "POST", body: { dailyChallenge } }),
  answer: (sessionId: string, questionNumber: number, answer: string) =>
    request<AnswerResult>(`/games/sessions/${sessionId}/answers`, { method: "POST", body: { questionNumber, answer } }),
  finish: (sessionId: string, status: "completed" | "abandoned") => request<SessionResult>(`/games/sessions/${sessionId}`, { method: "PATCH", body: { status } }),
  result: (sessionId: string) => request<SessionResult>(`/games/sessions/${sessionId}`),
  share: (sessionId: string) => request<{ shareText: string; firstShare: boolean }>(`/games/sessions/${sessionId}/share`, { method: "POST" }),
};

/** Contrato de API §6 — News. */
export const newsApi = {
  list: ({ category, search, days }: NewsFilters, page = 1, limit = 20) => request<Page<NewsArticle>>("/news", { query: { category, search, days, page, limit } }),
};

/** Contrato de API §8 — Credits. */
export const creditsApi = {
  balance: () => request<{ balance: number }>("/credits/balance"),
  earnMethods: () => request<EarnMethod[]>("/credits/earn-methods"),
  storeItems: () => request<StoreItem[]>("/store/items"),
  purchase: (itemId: string) => request<{ purchased: true; newBalance: number }>(`/store/items/${itemId}/purchase`, { method: "POST" }),
  equip: (itemId: string) => request<unknown>(`/store/items/${itemId}/equip`, { method: "POST" }),
};

/** Contrato de API §9 — Admin. */
export const adminApi = {
  summary: () => request<DashboardSummary>("/admin/dashboard/summary"),
  dau: () => request<{ days: Array<{ date: string; users: number }>; weeklyChange: number | null }>("/admin/dashboard/dau"),
  ranking: () => request<GameRanking[]>("/admin/dashboard/ranking"),

  users: (filter: PlayerFilter, search: string, page = 1, limit = 50) => request<AdminUsersPage>("/admin/users", { query: { filter, search, page, limit } }),
  user: (id: string) => request<AdminUserDetail>(`/admin/users/${id}`),
  setUserStatus: (id: string, status: "active" | "inactive") => request<AdminUserDetail>(`/admin/users/${id}/status`, { method: "PATCH", body: { status } }),
  deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: "DELETE" }),
  exportUsers: (filter: PlayerFilter, search: string) => download("/admin/users/export", { filter, search }, "football-maestro-users.csv"),

  analyticsKpis: () => request<{ averageSessionMinutes: number; retentionD7: number | null; dauMau: number | null }>("/admin/analytics/kpis"),
  growth: () => request<Array<{ month: string; newUsers: number; activeUsers: number }>>("/admin/analytics/growth"),
  retention: () => request<Array<{ day: number; rate: number | null }>>("/admin/analytics/retention"),
  categories: (days?: number) => request<Array<{ category: string; games: number }>>("/admin/analytics/categories", { query: { days } }),
  sessionDuration: (days?: number) => request<{ buckets: Array<{ range: string; pct: number }>; mostCommon: string | null }>("/admin/analytics/session-duration", { query: { days } }),
  accuracyRadar: (days?: number) => request<Array<{ category: string; accuracy: number | null }>>("/admin/analytics/accuracy-radar", { query: { days } }),

  reportSummary: (month?: string) => request<ReportSummary>("/admin/reports/summary", { query: { month } }),
  topPlayers: (month?: string) => request<TopPlayer[]>("/admin/reports/top-players", { query: { month } }),
  categoryPerformance: (month?: string) => request<CategoryPerformance[]>("/admin/reports/category-performance", { query: { month } }),
  peakHours: (month?: string) => request<{ hours: Array<{ hour: number; sessions: number }>; peakHour: number | null }>("/admin/reports/peak-hours", { query: { month } }),
  exportReport: (month?: string) => download("/admin/reports/export", { month }, "football-maestro-report.csv"),

  // Gráficas (RF-154 a RF-175). days = últimos 7, 30 o 90 días.
  trends: () => request<KpiTrend[]>("/admin/dashboard/trends"),
  playerActivity: (id: string) => request<PlayerActivity>(`/admin/users/${id}/activity`),
  gamesOverview: (days: number) => request<GamesOverview>("/admin/games/overview", { query: { days } }),
  gameScores: (gameId: string, days: number) => request<Array<{ score: number; sessions: number }>>(`/admin/games/${gameId}/scores`, { query: { days } }),
  hardestQuestions: (days: number) => request<HardQuestion[]>("/admin/games/hardest-questions", { query: { days } }),
  dailyChallengePlayers: (days: number) => request<Array<{ date: string; players: number }>>("/admin/games/daily-challenge", { query: { days } }),
  creditsFlow: (days: number) => request<CreditsFlow>("/admin/economy/flow", { query: { days } }),
  creditReasons: (days: number) => request<Array<{ reason: EarnReason; credits: number }>>("/admin/economy/reasons", { query: { days } }),
  creditsCirculation: (days: number) => request<Array<{ date: string; credits: number }>>("/admin/economy/circulation", { query: { days } }),
  itemPurchases: () => request<ItemPurchases[]>("/admin/economy/items"),
  badgeHolders: () => request<Array<{ code: string; name: string; icon: string; players: number }>>("/admin/economy/badges"),
  signups: (days: number) => request<Array<{ date: string; users: number }>>("/admin/analytics/signups", { query: { days } }),
  funnel: (days: number) => request<Array<{ step: "registered" | "firstGame" | "regular" | "returned"; players: number }>>("/admin/analytics/funnel", { query: { days } }),
  countries: () => request<Array<{ country: string; players: number }>>("/admin/analytics/countries"),
  signupMethods: () => request<Array<{ method: "email" | "google" | "both"; players: number }>>("/admin/analytics/signup-methods"),
  levels: () => request<Array<{ range: string; players: number }>>("/admin/analytics/levels"),
  heatmap: (days: number) => request<Array<{ weekday: number; hour: number; sessions: number }>>("/admin/analytics/heatmap", { query: { days } }),
};
