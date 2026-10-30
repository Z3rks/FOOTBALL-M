import { useEffect, useState } from "react";
import { animate, motion } from "motion/react";
import { Banknote, Tag } from "lucide-react";
import { detail, ResultBanner } from "./parts";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const ACCENT = "#059669";

/** How much was he worth?: se elige el precio del traspaso con un deslizador; acierta si queda cerca. */
export default function ValueView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const max = detail(question.details, "max", 250);
  const [guess, setGuess] = useState(Math.round(max / 2));
  const [revealed, setRevealed] = useState<number | null>(null);
  const actual = feedback ? Number(feedback.correctAnswer) : null;
  const myGuess = picked !== null ? Number(picked) : guess;

  // El precio real "sube" desde lo que dijo el jugador hasta el valor verdadero.
  useEffect(() => {
    if (actual === null) return;
    const controls = animate(myGuess, actual, { duration: 1.1, onUpdate: (v) => setRevealed(Math.round(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual]);

  const diff = actual !== null ? myGuess - actual : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 shadow-md text-white" style={{ background: `linear-gradient(135deg, ${ACCENT}, #047857)` }}>
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-white/80 mb-3">
          <Banknote className="w-4 h-4" /> {t("play.value.label")} · {question.questionNumber}
        </p>
        <p className="text-xl font-bold">{detail(question.details, "player", "")}</p>
        <p className="text-sm text-white/80">
          {detail(question.details, "from", "")} → {detail(question.details, "to", "")} · {detail(question.details, "year", "")}
        </p>

        <motion.div className="mt-5 flex items-center justify-center gap-2" key={actual ?? "guess"} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <Tag className="w-6 h-6 text-white/70" />
          <span className="text-5xl font-black tabular-nums">€{actual !== null ? revealed : guess}</span>
          <span className="text-xl font-bold text-white/80">M</span>
        </motion.div>
        {actual !== null && <p className="text-center text-sm text-white/80 mt-1">You said €{myGuess}M</p>}
      </div>

      {!feedback && (
        <div className="space-y-4">
          <input
            type="range"
            min={0}
            max={max}
            step={detail(question.details, "step", 1)}
            value={guess}
            onChange={(e) => setGuess(Number(e.target.value))}
            disabled={busy}
            className="w-full accent-emerald-600"
            aria-label={t("play.value.slider")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>€0M</span>
            <span>€{max}M</span>
          </div>
          <button onClick={() => onAnswer(String(guess))} disabled={busy} className="w-full py-3.5 rounded-xl font-bold text-white shadow-md disabled:opacity-50" style={{ background: ACCENT }}>
            {busy ? t("common.checking") : t("play.value.lock", { amount: guess })}
          </button>
        </div>
      )}

      {feedback && (
        <ResultBanner correct={feedback.isCorrect}>
          {feedback.isCorrect
            ? t("play.value.right", { diff: Math.abs(diff) })
            : t(diff > 0 ? "play.value.over" : "play.value.under", { fee: feedback.correctAnswer, diff: Math.abs(diff) })}
        </ResultBanner>
      )}
    </div>
  );
}
