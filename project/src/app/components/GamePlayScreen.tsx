import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { gamesApi } from "../api/api";
import { errorMessage } from "../api/hooks";
import type { AnswerResult, StartedSession } from "../api/types";
import { PLAY_STYLES } from "./games/playStyles";
import LoadState from "./LoadState";
import GameIcon from "./games/GameIcon";
import { useTranslation } from "react-i18next";

interface GamePlayScreenProps {
  gameId: string;
  dailyChallenge: boolean;
  onExit: () => void;
  onFinished: (sessionId: string) => void;
}

/**
 * Partida de un minijuego (RF-087 a RF-090). El puntaje lo calcula el servidor: aquí solo se
 * envía cada respuesta (que queda guardada al instante, RNF-DISP-03) y al final se cierra la partida.
 * Cómo se ve cada pregunta depende del estilo del minijuego (components/games/playStyles).
 * Es un modo enfocado: ocupa toda la ventana, sin la barra de secciones, y la pregunta va centrada.
 */
export default function GamePlayScreen({ gameId, dailyChallenge, onExit, onFinished }: GamePlayScreenProps) {
  const { t } = useTranslation();
  const [session, setSession] = useState<StartedSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode monta dos veces en desarrollo: se inicia una sola partida.
    if (started.current) return;
    started.current = true;
    gamesApi
      .start(gameId, dailyChallenge)
      .then(setSession)
      .catch((err) => setError(errorMessage(err)));
  }, [gameId, dailyChallenge]);

  const style = PLAY_STYLES[session?.playStyle ?? "multiple-choice"] ?? PLAY_STYLES["multiple-choice"];
  const { View, theme } = style;
  const question = session?.questions[index];
  const isLast = session ? index === session.totalQuestions - 1 : false;

  const submitAnswer = async (answer: string) => {
    if (!session || !question || busy || feedback) return;
    setBusy(true);
    setPicked(answer);
    try {
      setFeedback(await gamesApi.answer(session.sessionId, question.questionNumber, answer));
    } catch (err) {
      toast.error(errorMessage(err));
      setPicked(null);
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    if (!session) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      setFeedback(null);
      setPicked(null);
      return;
    }
    setBusy(true);
    try {
      await gamesApi.finish(session.sessionId, "completed");
      onFinished(session.sessionId);
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  // RF-090: salir sin terminar deja la partida abandonada y vuelve al catálogo.
  const exit = async () => {
    if (session && !window.confirm(t("game.leaveConfirm"))) return;
    if (session) await gamesApi.finish(session.sessionId, "abandoned").catch(() => undefined);
    onExit();
  };

  return (
    <div className={`h-screen w-full flex flex-col transition-colors ${theme.screen}`}>
      {/* Header */}
      <div className={`px-4 md:px-8 py-4 ${theme.header}`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <button onClick={exit} className={`p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors ${theme.headerText}`} aria-label={t("game.leave")}>
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className={`flex items-center justify-center gap-2 font-semibold ${theme.headerText}`}>
                {session && <GameIcon icon={session.game.icon} variant="plain" />}
                {session ? session.game.name : t("common.loading")}
              </p>
              {session?.isDailyChallenge && <p className={`text-xs font-semibold ${theme.subtitle}`}>{t("home.dailyChallenge")}</p>}
            </div>
            <span className={`text-sm font-semibold w-9 text-right opacity-80 ${theme.headerText}`}>{session ? `${index + 1}/${session.totalQuestions}` : ""}</span>
          </div>
          {session && (
            <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${theme.progressTrack}`}>
              <div className={`h-full transition-all ${theme.progressBar}`} style={{ width: `${((index + (feedback ? 1 : 0)) / session.totalQuestions) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10">
        <div className="max-w-2xl mx-auto">
          {error ? (
            <div className="space-y-4">
              <LoadState loading={false} error={error} />
              <button onClick={onExit} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-md hover:bg-secondary transition-colors">
                {t("results.backToGames")}
              </button>
            </div>
          ) : !question ? (
            <LoadState loading error={null} />
          ) : (
            <div className="space-y-5">
              <View key={question.questionNumber} question={question} feedback={feedback} picked={picked} busy={busy} onAnswer={submitAnswer} />

              {feedback && (
                <button onClick={next} disabled={busy} className={`w-full py-3.5 rounded-xl font-semibold shadow-md transition-colors disabled:opacity-60 ${theme.button}`}>
                  {isLast ? (busy ? t("game.finishing") : t("game.seeResults")) : t("game.next")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
