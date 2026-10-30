import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HelpCircle, Lock, Search } from "lucide-react";
import { ChoiceButtons, detail, ResultBanner, RevealButton } from "./parts";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const ACCENT = "#4F46E5";

/** Who is it?: jugador misterioso con pistas que se desbloquean una a una (de la más vaga a la más clara). */
export default function CluesView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const clues = detail<string[]>(question.details, "clues", []);
  const [shown, setShown] = useState(1);
  const visible = feedback ? clues.length : shown;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 text-white shadow-md" style={{ background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)` }}>
        <div className="flex items-center gap-4">
          <motion.div
            className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center"
            animate={feedback ? { rotateY: 360 } : { scale: [1, 1.06, 1] }}
            transition={feedback ? { duration: 0.6 } : { repeat: Infinity, duration: 2 }}
          >
            <HelpCircle className="w-9 h-9" />
          </motion.div>
          <div>
            <p className="text-xs font-bold tracking-widest text-white/70">{t("play.clues.label")} · {question.questionNumber}</p>
            <p className="text-lg font-bold">{t("play.clues.title")}</p>
            <p className="text-xs text-white/70">{t("play.clues.tagline")}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {clues.map((clue, i) => (
          <AnimatePresence key={i} mode="wait">
            {i < visible ? (
              <motion.div
                key="open"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3"
                style={{ borderColor: `${ACCENT}33` }}
              >
                <span className="w-6 h-6 shrink-0 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: ACCENT }}>
                  {i + 1}
                </span>
                <p className="text-sm text-foreground">{clue}</p>
              </motion.div>
            ) : (
              <motion.div key="locked" className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" /> {t("play.clues.clue", { n: i + 1 })}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {!feedback && shown < clues.length && (
        <RevealButton accent={ACCENT} onClick={() => setShown((n) => n + 1)} disabled={busy}>
          <span className="inline-flex items-center gap-2">
            <Search className="w-4 h-4" /> {t("play.clues.reveal")}
          </span>
        </RevealButton>
      )}

      <ChoiceButtons options={question.options ?? []} feedback={feedback} picked={picked} disabled={busy} accent={ACCENT} onAnswer={onAnswer} layout="grid" />

      {feedback && (
        <ResultBanner correct={feedback.isCorrect}>
          {feedback.isCorrect
            ? t(shown === 1 ? "play.clues.rightOneClue" : "play.clues.right", { answer: feedback.correctAnswer })
            : t("play.itWas", { answer: feedback.correctAnswer })}
        </ResultBanner>
      )}
    </div>
  );
}
