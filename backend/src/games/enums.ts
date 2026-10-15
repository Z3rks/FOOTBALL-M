/** Categorías del catálogo de minijuegos (MinigamesScreen, RF-085). */
export enum GameCategory {
  PLAYERS = 'Players',
  CLUBS = 'Clubs',
  STADIUMS = 'Stadiums',
  LOGIC = 'Logic',
  HISTORY = 'History',
  TRANSFERS = 'Transfers',
  TEAMS = 'Teams',
  RULES = 'Rules',
}

/** Dificultades del catálogo (RF-084). */
export enum GameDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  EXPERT = 'Expert',
}

export enum GameSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}
