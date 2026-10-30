import type { ReactNode } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AnswerResult } from "../../api/types";

/**
 * Piezas comunes de las vistas de minijuegos. Cada estilo les pasa su color (`accent`), así todos
 * comparten el comportamiento pero cada uno conserva su look.
 */

interface StatementProps {
  label: string;
  icon: ReactNode;
  accent: string;
  children: ReactNode;
  hint?: string;
}

/** Tarjeta del enunciado con la etiqueta del minijuego. */
export function StatementCard({ label, icon, accent, children, hint }: StatementProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-card p-5 shadow-sm" style={{ borderColor: `${accent}40` }}>
      <p className="flex items-center gap-2 text-xs font-bold tracking-widest mb-2" style={{ color: accent }}>
        {icon} {label}
      </p>
      <div className="text-lg font-semibold text-foreground">{children}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </motion.div>
  );
}

interface ChoiceButtonsProps {
  options: string[];
  feedback: AnswerResult | null;
  picked: string | null;
  disabled: boolean;
  accent: string;
  onAnswer: (answer: string) => void;
  /** "list": una por fila; "grid": 2 columnas; "chips": fichas redondeadas. */
  layout?: "list" | "grid" | "chips";
  /** Respuesta correcta tal como la compara la vista (por defecto la de la API). */
  correct?: string;
}

/** Botones de respuesta: al responder, la correcta en verde y la elegida (si falló) en rojo. */
export function ChoiceButtons({ options, feedback, picked, disabled, accent, onAnswer, layout = "list", correct }: ChoiceButtonsProps) {
  const right = correct ?? feedback?.correctAnswer;
  const wrapper = layout === "grid" ? "grid grid-cols-2 gap-2.5" : layout === "chips" ? "flex flex-wrap gap-2" : "space-y-2.5";
  const shape = layout === "chips" ? "rounded-full px-4 py-2 text-sm" : "rounded-xl px-4 py-3.5 text-left";

  return (
    <div className={wrapper}>
      {options.map((option, i) => {
        const state = !feedback ? "idle" : option === right ? "right" : option === picked ? "wrong" : "muted";
        return (
          <motion.button
            key={option}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: state === "muted" ? 0.5 : 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAnswer(option)}
            disabled={disabled || !!feedback}
            className={`${shape} ${layout === "grid" ? "text-center" : ""} w-full font-medium border-2 transition-colors ${
              state === "right" ? "bg-green-50 border-green-500 text-green-700" : state === "wrong" ? "bg-red-50 border-red-500 text-red-700" : "bg-card text-foreground"
            }`}
            style={state === "idle" || state === "muted" ? { borderColor: `${accent}33` } : undefined}
            onMouseEnter={(e) => state === "idle" && (e.currentTarget.style.borderColor = accent)}
            onMouseLeave={(e) => state === "idle" && (e.currentTarget.style.borderColor = `${accent}33`)}
          >
            {option}
          </motion.button>
        );
      })}
    </div>
  );
}

/** Mensaje de acierto o error bajo la pregunta. */
export function ResultBanner({ correct, children }: { correct: boolean; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-start gap-3 rounded-xl p-4 ${correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
    >
      {correct ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
      <div className="text-sm font-medium">{children}</div>
    </motion.div>
  );
}

/** Botón para revelar la siguiente pista o parte. */
export function RevealButton({ accent, onClick, disabled, children }: { accent: string; onClick: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl border-2 border-dashed py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40"
      style={{ borderColor: `${accent}66`, color: accent }}
    >
      {children}
    </button>
  );
}

/** Lee un campo de `details` con un valor por defecto. */
export function detail<T>(details: Record<string, unknown> | null, key: string, fallback: T): T {
  const value = details?.[key];
  return value === undefined || value === null ? fallback : (value as T);
}
