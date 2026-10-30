import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../api/api";
import { useApi } from "../../../api/hooks";
import { shortDateLabel } from "../../../format";
import type { Period } from "../charts";

/**
 * Datos de AdminGamesScreen (RF-154 a RF-160), ya listos para dibujar: minijuegos ordenados
 * para cada gráfica, totales del período y la distribución de puntajes del minijuego elegido.
 */
export function useGamesInsights(days: Period) {
  const overview = useApi(() => adminApi.gamesOverview(days), [days]);
  const hardest = useApi(() => adminApi.hardestQuestions(days), [days]);
  const daily = useApi(() => adminApi.dailyChallengePlayers(days), [days]);
  const games = useMemo(() => overview.data?.games ?? [], [overview.data]);

  // El histograma de puntajes arranca con el minijuego más jugado del período.
  const [scoreGame, setScoreGame] = useState("");
  useEffect(() => {
    if (!scoreGame && games.length) setScoreGame([...games].sort((a, b) => b.completed - a.completed)[0].gameId);
  }, [games, scoreGame]);
  const scores = useApi(() => (scoreGame ? adminApi.gameScores(scoreGame, days) : Promise.resolve([])), [scoreGame, days]);

  const started = (g: { completed: number; abandoned: number }) => g.completed + g.abandoned;
  const totals = useMemo(() => {
    const completed = games.reduce((s, g) => s + g.completed, 0);
    const abandoned = games.reduce((s, g) => s + g.abandoned, 0);
    const graded = games.filter((g) => g.accuracy !== null);
    const gradedGames = graded.reduce((s, g) => s + g.completed, 0);
    return {
      completed,
      started: completed + abandoned,
      abandonRate: completed + abandoned ? (abandoned / (completed + abandoned)) * 100 : null,
      // Promedio ponderado por partidas: un minijuego con más partidas pesa más.
      accuracy: gradedGames ? graded.reduce((s, g) => s + (g.accuracy ?? 0) * g.completed, 0) / gradedGames : null,
    };
  }, [games]);

  const locales = overview.data?.locales ?? [];
  return {
    queries: { overview, hardest, daily, scores },
    games,
    totals,
    /** De más jugado a menos jugado. */
    byPlays: [...games].sort((a, b) => started(b) - started(a)),
    /** Solo los jugados, del más abandonado al menos abandonado. */
    byAbandon: games.filter((g) => started(g) > 0).sort((a, b) => (b.abandonRate ?? 0) - (a.abandonRate ?? 0)),
    /** Del más difícil al más fácil. */
    byAccuracy: games.filter((g) => g.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)),
    locales,
    localeTotal: locales.reduce((s, l) => s + l.sessions, 0),
    hardestQuestions: hardest.data ?? [],
    scoreGame,
    setScoreGame,
    scoreData: scores.data ?? [],
    dailyData: (daily.data ?? []).map((d) => ({ ...d, label: shortDateLabel(d.date) })),
  };
}
