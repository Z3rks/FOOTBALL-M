import { useMemo } from "react";
import { motion } from "motion/react";
import { MonitorPlay } from "lucide-react";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

/** Decisión revelada: {"a":"No gol","w":"explicación"}. */
function parseVerdict(value: string): { a: string; w: string } | null {
  try {
    const parsed = JSON.parse(value) as { a?: string; w?: string };
    return typeof parsed.a === "string" && typeof parsed.w === "string" ? { a: parsed.a, w: parsed.w } : null;
  } catch {
    return null;
  }
}

/** Goal or No Goal?: monitor del VAR con la jugada; se decide entre dos opciones y se ve la regla. */
export default function VarView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const verdict = useMemo(() => (feedback ? parseVerdict(feedback.correctAnswer) : null), [feedback]);
  const options = question.options ?? [];
  const play = typeof question.details?.play === "string" ? question.details.play : t("play.var.check");

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-cyan-300">
            <MonitorPlay className="w-4 h-4" /> {t("play.var.label")} · {question.questionNumber}
          </p>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
            <motion.span className="w-2 h-2 rounded-full bg-red-500" animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} /> {play.toUpperCase()}
          </span>
        </div>
        <p className="relative z-10 text-base font-medium leading-relaxed">{question.statement}</p>
        {!feedback && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent"
            animate={{ top: ["-15%", "105%"] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
          />
        )}
        {verdict && (
          <motion.div
            initial={{ scale: 2, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className={`mt-4 inline-block rounded-lg border-4 px-4 py-1 text-xl font-black ${feedback?.isCorrect ? "border-green-400 text-green-300" : "border-red-400 text-red-300"}`}
          >
            {t("play.var.decision", { call: verdict.a.toUpperCase() })}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option, i) => {
          const isRight = verdict?.a === option;
          const isPicked = picked === option;
          const base = i === 0 ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700";
          return (
            <motion.button
              key={option}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAnswer(option)}
              disabled={busy || !!feedback}
              className={`h-20 rounded-2xl text-white text-lg font-black uppercase shadow-md transition-all ${base} ${
                feedback && !isRight ? "opacity-40" : ""
              } ${feedback && isRight ? "ring-4 ring-offset-2 ring-yellow-400" : ""} ${feedback && isPicked && !isRight ? "line-through" : ""}`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>

      {verdict && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className={`font-bold mb-1 ${feedback?.isCorrect ? "text-green-700" : "text-red-700"}`}>{feedback?.isCorrect ? t("play.var.right") : t("play.var.wrong")}</p>
          <p className="text-sm text-slate-700">📖 {verdict.w}</p>
        </motion.div>
      )}
    </div>
  );
}
