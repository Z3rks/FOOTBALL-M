import { Locale } from '../../shared/i18n/locale';

/** Textos de los CSV del panel administrativo en cada idioma (encabezados y nombres de archivo). */
export interface CsvLabels {
  usersFile: string;
  usersHeader: string[];
  reportFile: (month: string) => string;
  reportTitle: string;
  keyMetrics: string;
  totalGames: string;
  averageSessionMinutes: string;
  questionsAnswered: string;
  averageDailyXp: string;
  weeksHeader: string[];
  weekLabel: (week: number) => string;
  topPlayersHeader: string[];
  categoriesHeader: string[];
  category: (category: string) => string;
  hoursHeader: string[];
}

/**
 * Categorías de minijuego en español. Se usan los valores tal como los entrega GamesStatsReader
 * (Admin no importa el enum interno de Games); una categoría nueva sin traducir sale tal cual.
 */
const CATEGORY_ES: Record<string, string> = {
  Players: 'Jugadores',
  Clubs: 'Clubes',
  Stadiums: 'Estadios',
  Logic: 'Lógica',
  History: 'Historia',
  Transfers: 'Fichajes',
  Teams: 'Equipos',
  Rules: 'Reglas',
};

export const CSV_LABELS: Record<Locale, CsvLabels> = {
  en: {
    usersFile: 'football-maestro-users.csv',
    usersHeader: ['username', 'email', 'country', 'status', 'level', 'streak_days', 'xp_total', 'accuracy', 'registered_at'],
    reportFile: (month) => `football-maestro-report-${month}.csv`,
    reportTitle: 'Football Maestro report',
    keyMetrics: 'Key metrics',
    totalGames: 'total_games',
    averageSessionMinutes: 'average_session_min',
    questionsAnswered: 'questions_answered',
    averageDailyXp: 'average_daily_xp',
    weeksHeader: ['week', 'from', 'to', 'users', 'games', 'xp'],
    weekLabel: (week) => `Wk ${week}`,
    topPlayersHeader: ['rank', 'user', 'country', 'xp', 'accuracy'],
    categoriesHeader: ['category', 'games', 'accuracy', 'trend'],
    category: (category) => category,
    hoursHeader: ['hour', 'sessions'],
  },
  es: {
    usersFile: 'football-maestro-usuarios.csv',
    usersHeader: ['usuario', 'correo', 'pais', 'estado', 'nivel', 'racha_dias', 'xp_total', 'precision', 'fecha_registro'],
    reportFile: (month) => `football-maestro-reporte-${month}.csv`,
    reportTitle: 'Reporte Football Maestro',
    keyMetrics: 'Métricas clave',
    totalGames: 'total_partidas',
    averageSessionMinutes: 'duracion_media_min',
    questionsAnswered: 'preguntas_respondidas',
    averageDailyXp: 'xp_diario_promedio',
    weeksHeader: ['semana', 'desde', 'hasta', 'usuarios', 'partidas', 'xp'],
    weekLabel: (week) => `Sem ${week}`,
    topPlayersHeader: ['puesto', 'usuario', 'pais', 'xp', 'precision'],
    categoriesHeader: ['categoria', 'partidas', 'precision', 'tendencia'],
    category: (category) => CATEGORY_ES[category] ?? category,
    hoursHeader: ['hora', 'sesiones'],
  },
};
