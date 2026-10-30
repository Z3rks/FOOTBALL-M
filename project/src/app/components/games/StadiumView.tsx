import { useEffect, useState } from "react";
import { animate, motion } from "motion/react";
import { Building2 } from "lucide-react";
import { flag } from "../../format";
import { ChoiceButtons, detail, ResultBanner, RevealButton } from "./parts";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const ACCENT = "#16A34A";

/** Número que sube hasta su valor al aparecer. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, { duration: 1.2, onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [value]);
  return <>{shown.toLocaleString("en-US")}</>;
}

/** Ilustración de un estadio visto desde arriba (dibujo propio). */
function StadiumDrawing() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-32" aria-hidden>
      <ellipse cx="100" cy="60" rx="96" ry="56" fill="#E5E7EB" />
      <ellipse cx="100" cy="60" rx="84" ry="46" fill="#9CA3AF" />
      <rect x="40" y="26" width="120" height="68" rx="4" fill={ACCENT} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={40 + i * 20} y="26" width="10" height="68" fill="#15803D" />
      ))}
      <rect x="40" y="26" width="120" height="68" rx="4" fill="none" stroke="#fff" strokeWidth="1.5" />
      <line x1="100" y1="26" x2="100" y2="94" stroke="#fff" strokeWidth="1.5" />
      <circle cx="100" cy="60" r="11" fill="none" stroke="#fff" strokeWidth="1.5" />
      <rect x="40" y="46" width="14" height="28" fill="none" stroke="#fff" strokeWidth="1.5" />
      <rect x="146" y="46" width="14" height="28" fill="none" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

/** Guess the Stadium: ficha del estadio que se revela por partes (país, apertura, aforo y ciudad). */
export default function StadiumView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState(1);
  const revealed = feedback ? 4 : stage;
  const rows = [
    { label: t("play.facts.country"), reveal: t("play.stadium.revealCountry"), value: <span className="text-2xl">{flag(detail(question.details, "flag", ""))}</span> },
    { label: t("play.facts.opened"), reveal: t("play.stadium.revealOpened"), value: String(detail(question.details, "opened", "?")) },
    { label: t("play.facts.capacity"), reveal: t("play.stadium.revealCapacity"), value: <CountUp value={detail(question.details, "capacity", 0)} /> },
    { label: t("play.facts.city"), reveal: t("play.stadium.revealCity"), value: detail(question.details, "city", "?") },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm" style={{ borderColor: `${ACCENT}33` }}>
        <div className="px-5 pt-4">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest" style={{ color: ACCENT }}>
            <Building2 className="w-4 h-4" /> {t("play.stadium.label")} · {question.questionNumber}
          </p>
        </div>
        <motion.div initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="px-3">
          <StadiumDrawing />
        </motion.div>
        <div className="grid grid-cols-2 gap-px bg-border">
          {rows.map((row, i) => (
            <div key={row.label} className="bg-card px-4 py-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">{row.label}</p>
              {revealed > i ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-bold text-foreground">
                  {row.value}
                </motion.div>
              ) : (
                <p className="font-bold text-muted-foreground/40">• • •</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {!feedback && stage < rows.length && (
        <RevealButton accent={ACCENT} onClick={() => setStage((s) => s + 1)} disabled={busy}>
          {rows[stage].reveal}
        </RevealButton>
      )}

      <ChoiceButtons options={question.options ?? []} feedback={feedback} picked={picked} disabled={busy} accent={ACCENT} onAnswer={onAnswer} />

      {feedback && <ResultBanner correct={feedback.isCorrect}>{feedback.isCorrect ? t("play.stadium.right") : t("play.itWas", { answer: feedback.correctAnswer })}</ResultBanner>}
    </div>
  );
}
