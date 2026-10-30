import { motion } from "motion/react";
import { ArrowRightLeft } from "lucide-react";
import { ChoiceButtons, detail, ResultBanner } from "./parts";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const ACCENT = "#0D9488";

/** The Transfer: la trayectoria del jugador como una línea de metro; la última estación está oculta. */
export default function CareerView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const player = detail(question.details, "player", "");
  const year = detail(question.details, "year", 0);
  const path = detail<string[]>(question.details, "path", []);
  const next = feedback ? feedback.correctAnswer : null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5 shadow-sm" style={{ borderColor: `${ACCENT}33` }}>
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest mb-1" style={{ color: ACCENT }}>
          <ArrowRightLeft className="w-4 h-4" /> {t("play.career.label")} · {question.questionNumber}
        </p>
        <p className="text-lg font-bold text-foreground mb-4">{player}</p>

        <div className="relative pl-2">
          <div className="absolute left-[15px] top-2 bottom-2 w-1 rounded-full" style={{ background: `${ACCENT}33` }} />
          {path.map((club, i) => (
            <motion.div key={club + i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25 }} className="relative flex items-center gap-3 py-1.5">
              <span className="z-10 w-4 h-4 rounded-full border-4 bg-white" style={{ borderColor: ACCENT }} />
              <span className="text-sm font-medium text-foreground">{club}</span>
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: path.length * 0.25 }} className="relative flex items-center gap-3 py-1.5">
            <motion.span
              className="z-10 w-4 h-4 rounded-full"
              style={{ background: next ? (feedback?.isCorrect ? "#16A34A" : "#DC2626") : ACCENT }}
              animate={next ? { scale: 1 } : { scale: [1, 1.4, 1] }}
              transition={next ? {} : { repeat: Infinity, duration: 1.2 }}
            />
            <motion.span
              key={next ?? "unknown"}
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ background: `${ACCENT}1A`, color: ACCENT }}
            >
              {next ?? "?"} <span className="font-medium text-muted-foreground">· {year}</span>
            </motion.span>
          </motion.div>
        </div>
      </div>

      <p className="text-sm font-semibold text-muted-foreground">{t("play.career.question")}</p>
      <ChoiceButtons options={question.options ?? []} feedback={feedback} picked={picked} disabled={busy} accent={ACCENT} onAnswer={onAnswer} layout="chips" />

      {feedback && <ResultBanner correct={feedback.isCorrect}>{feedback.isCorrect ? t("play.career.right") : t("play.career.wrong", { answer: feedback.correctAnswer })}</ResultBanner>}
    </div>
  );
}
