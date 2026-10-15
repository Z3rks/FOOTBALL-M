export interface PlayerGameStats {
  gamesPlayed: number;
  correctAnswers: number;
  answeredQuestions: number;
  dailyChallengesCompleted: number;
  categoriesPlayed: number;
  categoriesAvailable: number;
}

/**
 * Interfaz pública y mínima de Games para Users (perfil, precisión e insignias): el resumen
 * de las partidas completadas de un jugador. Users depende de esta abstracción y no de los
 * servicios internos de Games (segregación de interfaces e inversión de dependencias).
 */
export abstract class PlayerGameStatsReader {
  abstract getPlayerStats(userId: string): Promise<PlayerGameStats>;
}
