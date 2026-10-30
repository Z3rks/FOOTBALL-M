import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Eye } from "lucide-react";
import { flag } from "../../format";
import { ChoiceButtons, detail, ResultBanner, RevealButton } from "./parts";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const ACCENT = "#7C3AED";
/** Desenfoque de la ficha en cada nivel (se aclara sola cada pocos segundos). */
const BLUR_PX = [10, 6, 3, 0];
const SHARPEN_EVERY_MS = 4000;

/** Silueta genérica de un jugador (dibujo propio, no es la foto de nadie). */
function PlayerSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 120" className="w-28 h-32" aria-hidden>
      <circle cx="50" cy="24" r="16" fill={color} />
      <path d="M22 118 L26 62 Q28 44 50 44 Q72 44 74 62 L78 118 Z" fill={color} />
      <path d="M26 62 L8 90 L16 94 L32 72 Z M74 62 L92 90 L84 94 L68 72 Z" fill={color} />
    </svg>
  );
}

/** Silhouette: ficha borrosa del jugador (bandera, posición, época, dato) que se va aclarando. */
export default function SilhouetteView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const [level, setLevel] = useState(0);
  const card = {
    flag: detail(question.details, "flag", ""),
    position: detail(question.details, "position", ""),
    era: detail(question.details, "era", ""),
    fact: detail(question.details, "fact", ""),
  };
  const blur = feedback ? 0 : BLUR_PX[level];

  useEffect(() => {
    if (feedback || level >= BLUR_PX.length - 1) return;
    const timer = setTimeout(() => setLevel((l) => l + 1), SHARPEN_EVERY_MS);
    return () => clearTimeout(timer);
  }, [level, feedback]);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl p-5 shadow-md" style={{ background: "linear-gradient(160deg, #F5F3FF, #EDE9FE)" }}>
        <p className="text-xs font-bold tracking-widest mb-3" style={{ color: ACCENT }}>
          {t("play.silhouette.label")} · {question.questionNumber}
        </p>
        <div className="flex items-center gap-4">
          <motion.div animate={{ filter: `blur(${feedback ? 0 : Math.max(0, blur - 2)}px)` }} transition={{ duration: 0.8 }}>
            <PlayerSilhouette color={feedback ? ACCENT : "#1E1B4B"} />
          </motion.div>
          <motion.div className="flex-1 space-y-2" animate={{ filter: `blur(${blur}px)` }} transition={{ duration: 0.8 }}>
            <p className="text-3xl leading-none">{flag(card.flag)}</p>
            <p className="font-bold text-foreground">{card.position}</p>
            <p className="text-xs text-muted-foreground">{card.era}</p>
          </motion.div>
        </div>
        <motion.p className="mt-4 text-sm text-foreground bg-white/70 rounded-lg px-3 py-2" animate={{ filter: `blur(${blur}px)` }} transition={{ duration: 0.8 }}>
          {card.fact}
        </motion.p>
        {!feedback && (
          <div className="mt-3 h-1 rounded-full bg-white overflow-hidden">
            <motion.div className="h-full" style={{ background: ACCENT }} animate={{ width: `${(level / (BLUR_PX.length - 1)) * 100}%` }} />
          </div>
        )}
      </div>

      {!feedback && level < BLUR_PX.length - 1 && (
        <RevealButton accent={ACCENT} onClick={() => setLevel((l) => l + 1)} disabled={busy}>
          <span className="inline-flex items-center gap-2">
            <Eye className="w-4 h-4" /> {t("play.silhouette.sharpen")}
          </span>
        </RevealButton>
      )}

      <ChoiceButtons options={question.options ?? []} feedback={feedback} picked={picked} disabled={busy} accent={ACCENT} onAnswer={onAnswer} />

      {feedback && <ResultBanner correct={feedback.isCorrect}>{feedback.isCorrect ? t("play.silhouette.right") : t("play.itWas", { answer: feedback.correctAnswer })}</ResultBanner>}
    </div>
  );
}
