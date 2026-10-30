import { useMemo, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { CalendarClock, RotateCcw, Trophy, X } from "lucide-react";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const GOLD = "#F0B429";
/** Dorado más oscuro para textos sobre fondo blanco (buen contraste). */
const GOLD_TEXT = "#B7791F";

/** Respuesta correcta que revela la API tras responder: [["Maracanazo", 1950], …] en orden. */
function parseSolution(value: string): Array<[string, number]> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Array<[string, number]>) : null;
  } catch {
    return null;
  }
}

/**
 * Timeline: se tocan los eventos en orden, del más antiguo al más reciente, y vuelan a su lugar
 * en la línea de tiempo. Al confirmar se revelan los años. Estilo "archivo histórico" en dorado
 * sobre fondo blanco.
 */
export default function TimelineView({ question, feedback, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const events = question.options ?? [];
  const [order, setOrder] = useState<string[]>([]);
  const solution = useMemo(() => (feedback ? parseSolution(feedback.correctAnswer) : null), [feedback]);
  const locked = busy || !!feedback;
  const pool = events.filter((e) => !order.includes(e));
  const complete = order.length === events.length;

  const place = (event: string) => !locked && setOrder((o) => [...o, event]);
  const remove = (event: string) => !locked && setOrder((o) => o.filter((e) => e !== event));
  const yearOf = (event: string) => solution?.find(([e]) => e === event)?.[1];

  return (
    <div className="space-y-6">
      {/* Enunciado */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-5 bg-card shadow-sm"
        style={{ borderColor: `${GOLD}4D` }}
      >
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest mb-2" style={{ color: GOLD_TEXT }}>
          <CalendarClock className="w-4 h-4" /> {t("play.timeline.label")} · {question.questionNumber}
        </p>
        <p className="text-lg font-semibold text-foreground">{question.statement}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("play.timeline.hint")}</p>
      </motion.div>

      <LayoutGroup>
        {/* Línea de tiempo con 4 casillas */}
        <motion.div
          className="relative space-y-3"
          animate={feedback && !feedback.isCorrect ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="absolute left-5 top-3 bottom-3 w-0.5" style={{ background: `linear-gradient(${GOLD}, ${GOLD}33)` }} />
          {events.map((_, i) => {
            const event = order[i];
            const correct = solution ? solution[i]?.[0] === event : null;
            const year = event ? yearOf(event) : undefined;
            return (
              <div key={i} className="relative flex items-center gap-3 min-h-[52px]">
                <motion.div
                  className="relative z-10 w-10 h-10 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold bg-white shadow-sm"
                  style={{ borderColor: correct === null ? GOLD : correct ? "#22c55e" : "#ef4444", color: correct === null ? GOLD_TEXT : correct ? "#15803d" : "#b91c1c" }}
                  animate={year ? { scale: [0.6, 1.15, 1] } : { scale: 1 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                >
                  {year ?? i + 1}
                </motion.div>
                {event ? (
                  <motion.button
                    layoutId={event}
                    onClick={() => remove(event)}
                    disabled={locked}
                    className={`flex-1 flex items-center justify-between gap-2 text-left rounded-xl px-4 py-3 text-sm font-medium border-2 ${
                      correct === null ? "bg-amber-50 border-amber-300 text-foreground" : correct ? "bg-green-50 border-green-500 text-green-800" : "bg-red-50 border-red-500 text-red-800"
                    }`}
                  >
                    <span>{event}</span>
                    {!locked && <X className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </motion.button>
                ) : (
                  <div className="flex-1 rounded-xl border-2 border-dashed border-amber-200 px-4 py-3 text-sm text-muted-foreground">
                    {i === order.length ? t("play.timeline.tapNext") : ""}
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Eventos por ubicar */}
        {!feedback && pool.length > 0 && (
          <div className="grid gap-2">
            {pool.map((event) => (
              <motion.button
                key={event}
                layoutId={event}
                onClick={() => place(event)}
                disabled={locked}
                whileTap={{ scale: 0.96 }}
                className="w-full text-left rounded-xl px-4 py-3 text-sm font-medium text-foreground bg-card border-2 border-border hover:border-[#F0B429] shadow-sm transition-colors"
              >
                {event}
              </motion.button>
            ))}
          </div>
        )}
      </LayoutGroup>

      {/* Confirmar */}
      {!feedback && (
        <div className="flex gap-2">
          <button
            onClick={() => setOrder([])}
            disabled={locked || order.length === 0}
            className="p-3.5 rounded-xl border-2 border-border text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
            aria-label={t("play.timeline.reset")}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => onAnswer(JSON.stringify(order))}
            disabled={locked || !complete}
            className="flex-1 py-3.5 rounded-xl font-bold text-[#1a1a1a] shadow-md disabled:opacity-40 transition-opacity"
            style={{ background: GOLD }}
          >
            {busy ? t("common.checking") : t("play.timeline.lock")}
          </button>
        </div>
      )}

      {/* Resultado */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: events.length * 0.15 }}
          className={`rounded-xl p-4 border ${feedback.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
        >
          {feedback.isCorrect ? (
            <p className="flex items-center gap-2 font-semibold text-green-700">
              <Trophy className="w-5 h-5" /> {t("play.timeline.right")}
            </p>
          ) : (
            <>
              <p className="font-semibold text-red-700 mb-2">{t("play.timeline.wrong")}</p>
              <ol className="space-y-1 text-sm text-foreground">
                {solution?.map(([event, year]) => (
                  <li key={event} className="flex gap-3">
                    <span className="font-bold w-10" style={{ color: GOLD_TEXT }}>
                      {year}
                    </span>
                    {event}
                  </li>
                ))}
              </ol>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
