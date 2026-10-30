import { useState } from "react";
import { Trophy, Share2, RotateCcw, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { gamesApi } from "../api/api";
import { errorMessage, useApi } from "../api/hooks";
import { motivationalMessage } from "../format";
import LoadState from "./LoadState";
import PageHeader from "./layout/PageHeader";
import PlayerLayout from "./layout/PlayerLayout";
import { useTranslation } from "react-i18next";

interface ResultsScreenProps {
  sessionId: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onPlayAgain: (gameId: string) => void;
}

/** Resultado de una partida (RF-091 a RF-103), calculado por el servidor. */
export default function ResultsScreen({ sessionId, onBack, onNavigate, onPlayAgain }: ResultsScreenProps) {
  const { t } = useTranslation();
  const result = useApi(() => gamesApi.result(sessionId), [sessionId]);
  const [sharing, setSharing] = useState(false);
  const data = result.data;

  const score = data?.score ?? 0;
  const total = data?.totalQuestions ?? 0;
  const accuracy = Math.round(data?.accuracy ?? 0);

  // RF-099: comparte el texto con la cuadrícula; la primera vez da +25 créditos.
  const share = async () => {
    setSharing(true);
    try {
      const { shareText, firstShare } = await gamesApi.share(sessionId);
      if (navigator.share) {
        await navigator.share({ text: shareText }).catch(() => undefined);
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success(t("results.copied"));
      }
      if (firstShare) toast.success(t("results.shareReward"));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSharing(false);
    }
  };

  return (
    <PlayerLayout active="minigames" onNavigate={onNavigate}>
      <div className="max-w-5xl mx-auto">
        <PageHeader title={t("results.title")} subtitle={data?.game.name} back={{ label: t("nav.games"), onClick: onBack }} />
        <LoadState loading={result.loading} error={result.error} onRetry={result.reload} />

        {data && (
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <div className="space-y-6">
              {/* Score Display */}
              <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 text-center shadow-lg">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-full mb-4">
                  <Trophy className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-white text-5xl font-bold mb-2">
                  {score}/{total}
                </h2>
                <p className="text-white/90 text-lg">{motivationalMessage(accuracy)}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <span className="text-accent font-bold text-lg">{accuracy}%</span>
                    <span className="text-white/80 text-sm">{t("stats.accuracy")}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <span className="text-accent font-bold text-lg">+{data.xpEarned ?? 0}</span>
                    <span className="text-white/80 text-sm">XP</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{data.correctCount ?? score}</p>
                      <p className="text-xs text-muted-foreground">{t("results.correct")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{data.incorrectCount ?? total - score}</p>
                      <p className="text-xs text-muted-foreground">{t("results.incorrect")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Wordle-style Result Grid */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-sm text-foreground mb-3">{t("results.yourPerformance")}</h3>
                <div className="grid grid-cols-5 gap-2">
                  {data.answers.map((answer) => (
                    <div
                      key={answer.questionNumber}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold text-xs ${
                        answer.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      }`}
                    >
                      {answer.questionNumber}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fun Fact */}
              {data.funFact && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">{t("results.didYouKnow")}</h4>
                      <p className="text-sm text-muted-foreground">{data.funFact}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={share}
                  disabled={sharing}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-secondary transition-colors disabled:opacity-60"
                >
                  <Share2 className="w-5 h-5" />
                  {t("results.share")}
                </button>

                <button
                  onClick={() => onPlayAgain(data.game.id)}
                  className="w-full bg-white text-primary border-2 border-primary py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  {t("results.playAgain")}
                </button>

                <button onClick={onBack} className="sm:col-span-2 w-full text-muted-foreground py-3 rounded-xl font-medium hover:bg-muted transition-colors">
                  {t("results.backToGames")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PlayerLayout>
  );
}
