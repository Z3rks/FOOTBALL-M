import { motion } from "motion/react";
import { Star } from "lucide-react";
import { ChoiceButtons, detail, ResultBanner } from "./parts";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const ACCENT = "#15803D";

/** Dream Team: la alineación histórica sobre una cancha; hay que completar al jugador que falta. */
export default function LineupView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const rows = detail<Array<Array<string | null>>>(question.details, "rows", []);
  const missing = feedback ? feedback.correctAnswer : null;
  // Se dibuja del ataque (arriba) al portero (abajo).
  const pitchRows = [...rows].reverse();

  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest" style={{ color: ACCENT }}>
          <Star className="w-4 h-4" /> {t("play.lineup.label")} · {question.questionNumber}
        </p>
        <p className="text-lg font-bold text-foreground">{detail(question.details, "team", "")}</p>
        <p className="text-xs text-muted-foreground">{t("play.lineup.hint", { formation: detail(question.details, "formation", "") })}</p>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden border-4 border-white shadow-md py-4 space-y-3"
        style={{ background: "repeating-linear-gradient(0deg, #16A34A 0 28px, #15803D 28px 56px)", outline: "1px solid #bbf7d0" }}
      >
        <div className="absolute inset-x-6 top-1/2 h-px bg-white/60" />
        <div className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60" />
        {pitchRows.map((row, r) => (
          <div key={r} className="relative flex justify-around px-2">
            {row.map((name, c) => {
              const isGap = name === null;
              return (
                <motion.div key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (r * 4 + c) * 0.04 }} className="flex flex-col items-center w-16">
                  <motion.div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-black ${isGap ? "border-yellow-300 bg-yellow-400 text-green-900" : "border-white bg-white text-green-800"}`}
                    animate={isGap && !missing ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                    transition={isGap && !missing ? { repeat: Infinity, duration: 1.1 } : {}}
                  >
                    {isGap ? (missing ? "★" : "?") : name!.charAt(0)}
                  </motion.div>
                  <span className={`mt-0.5 text-[10px] leading-tight text-center font-semibold ${isGap ? "text-yellow-200" : "text-white"}`}>{isGap ? (missing ?? "???") : name}</span>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      <ChoiceButtons options={question.options ?? []} feedback={feedback} picked={picked} disabled={busy} accent={ACCENT} onAnswer={onAnswer} layout="grid" />

      {feedback && <ResultBanner correct={feedback.isCorrect}>{feedback.isCorrect ? t("play.lineup.right") : t("play.lineup.wrong", { answer: feedback.correctAnswer })}</ResultBanner>}
    </div>
  );
}
