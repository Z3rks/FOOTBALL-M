/** Tipos de las respuestas de la API (Contrato de API). */

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface Game {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  icon: string;
}

export interface DailyChallenge {
  date: string;
  title: string;
  game: Game;
  xpReward: number;
  creditsReward: number;
  completedToday: boolean;
}

export interface PublicQuestion {
  questionNumber: number;
  statement: string;
  options: string[] | null;
  mediaUrl: string | null;
  /** Datos públicos del estilo del minijuego (pistas, colores del escudo, alineación…). */
  details: Record<string, unknown> | null;
}

/** Cómo se juega la partida; cada estilo tiene su propia vista (components/games). */
export type PlayStyle =
  | "multiple-choice"
  | "clues"
  | "silhouette"
  | "crest"
  | "stadium"
  | "connections"
  | "timeline"
  | "career"
  | "value"
  | "lineup"
  | "var";

export interface StartedSession {
  sessionId: string;
  game: Game;
  playStyle: PlayStyle;
  isDailyChallenge: boolean;
  totalQuestions: number;
  expiresAt: string;
  questions: PublicQuestion[];
}

export interface AnswerResult {
  questionNumber: number;
  isCorrect: boolean;
  correctAnswer: string;
  answeredCount: number;
  totalQuestions: number;
}

export interface SessionResult {
  id: string;
  game: Game;
  /** Solo en partidas en curso (para retomarlas). */
  playStyle?: PlayStyle;
  status: "in_progress" | "completed" | "abandoned";
  isDailyChallenge: boolean;
  totalQuestions: number;
  answeredCount: number;
  answers: Array<{ questionNumber: number; isCorrect: boolean }>;
  score?: number;
  correctCount?: number;
  incorrectCount?: number;
  accuracy?: number;
  xpEarned?: number;
  funFact?: string | null;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  role: "player" | "admin";
  country: string | null;
  level: number;
  xpTotal: number;
  xpToNextLevel: number;
  streakDays: number;
  badgesCount: number;
  hasPassword: boolean;
}

export interface PlayerStats {
  accuracy: number;
  xpTotal: number;
  gamesPlayed: number;
  badgesCount: number;
}

export type NewsCategory = "Transfers" | "Champions League" | "World Cup" | "Premier League" | "La Liga" | "Serie A" | "Bundesliga" | "Copa Libertadores";

/** ?days= de GET /news: últimas 24 horas, 3 días o 7 días. */
export type NewsDays = 1 | 3 | 7;

/** Filtros de GET /news (RF-075, RF-176 a RF-178). */
export interface NewsFilters {
  category: NewsCategory | "All";
  search?: string;
  days?: NewsDays;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  category: NewsCategory;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
}

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface EarnMethod {
  reason: string;
  method: string;
  credits: number;
}

export interface StoreItem {
  id: string;
  name: string;
  type: "avatar" | "badge_frame" | "ball_icon" | "background";
  cost: number;
  icon: string;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
}

// ---------- Admin ----------

export interface Kpi {
  value: number | null;
  change: number | null;
}

export interface DashboardSummary {
  generatedAt: string;
  status: "online";
  /** `code` y `values` permiten traducir la alerta; `message` es el texto en inglés. */
  alerts: Array<{ type: "warn" | "info"; code: string; values: Record<string, number>; message: string }>;
  kpis: { totalUsers: Kpi; activeToday: Kpi; gamesToday: Kpi; averageAccuracy: Kpi };
}

export interface GameRanking {
  gameId: string;
  name: string;
  icon: string;
  plays: number;
  avgScore: number;
  trend: "up" | "down" | "flat";
}

export type PlayerFilter = "all" | "active" | "inactive" | "new7d";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  country: string | null;
  status: "active" | "inactive";
  level: number;
  streakDays: number;
  xpTotal: number;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  accuracy: number;
  creditsBalance: number;
  gamesPlayed: number;
  badgesCount: number;
  lastActiveAt: string | null;
}

export interface AdminUsersPage extends Page<AdminUser> {
  counts: Record<PlayerFilter, number>;
}

export interface ReportSummary {
  month: string;
  keyMetrics: { totalGames: number; averageSessionMinutes: number; questionsAnswered: number; averageDailyXpPerActiveUser: number };
  weeks: Array<{ label: string; week: number; from: string; to: string; users: number; games: number; xp: number; current: boolean }>;
}

export interface TopPlayer {
  rank: number;
  userId: string;
  username: string | null;
  country: string | null;
  xp: number;
  accuracy: number | null;
}

export interface CategoryPerformance {
  category: string;
  games: number;
  accuracy: number | null;
  trend: "up" | "down" | "flat";
}

// ── Gráficas del panel de administración (Contrato de API §9.1–§9.6) ──

export interface GamePerformance {
  gameId: string;
  name: string;
  icon: string;
  completed: number;
  abandoned: number;
  accuracy: number | null;
  abandonRate: number | null;
}

export interface GamesOverview {
  games: GamePerformance[];
  locales: Array<{ locale: string; sessions: number }>;
}

export interface HardQuestion {
  questionId: string;
  gameId: string;
  gameName: string;
  statement: string;
  answer: string | null;
  answers: number;
  correctRate: number;
}

export type EarnReason = "daily_challenge" | "streak_7_days" | "share_result" | "referral";

export interface CreditsFlow {
  granularity: "day" | "week";
  points: Array<{ start: string; earned: number; spent: number }>;
}

export interface ItemPurchases {
  itemId: string;
  name: string;
  icon: string;
  type: string;
  cost: number;
  purchases: number;
}

export interface KpiTrend {
  date: string;
  totalUsers: number;
  activeUsers: number;
  games: number;
  accuracy: number | null;
}

export interface PlayerActivity {
  dailyXp: Array<{ date: string; xp: number }>;
  accuracyByCategory: Array<{ category: string; accuracy: number | null }>;
}
