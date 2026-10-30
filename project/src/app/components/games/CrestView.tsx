import { useState } from "react";
import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { ChoiceButtons, detail, ResultBanner, RevealButton } from "./parts";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const ACCENT = "#DC2626";

/** Escudo dibujado con franjas en los colores del club (nunca el escudo real). */
function DrawnCrest({ colors, initials, showInitials, pixelated }: { colors: string[]; initials: string; showInitials: boolean; pixelated: boolean }) {
  const stripes = colors.length ? colors : ["#e5e7eb"];
  const shield = "M50 4 L92 16 L88 70 Q84 98 50 116 Q16 98 12 70 L8 16 Z";
  return (
    <motion.svg viewBox="0 0 100 120" className="w-32 h-40 drop-shadow-lg" animate={{ filter: pixelated ? "blur(6px)" : "blur(0px)" }} transition={{ duration: 0.8 }} aria-hidden>
      <defs>
        <clipPath id="crest-shield">
          <path d={shield} />
        </clipPath>
      </defs>
      <g clipPath="url(#crest-shield)">
        {stripes.map((color, i) => (
          <rect key={i} x={(100 / stripes.length) * i} y="0" width={100 / stripes.length + 0.5} height="120" fill={color} />
        ))}
      </g>
      <path d={shield} fill="none" stroke="#111827" strokeWidth="3" />
      {showInitials && (
        <motion.text x="50" y="68" textAnchor="middle" fontSize="20" fontWeight="800" fill="#111827" stroke="#ffffff" strokeWidth="0.8" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
          {initials}
        </motion.text>
      )}
    </motion.svg>
  );
}

/** Guess the Badge: escudo de colores que se va revelando (ciudad, fundación e iniciales). */
export default function CrestView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState(0);
  const colors = detail<string[]>(question.details, "colors", []);
  const facts = [
    { label: t("play.facts.city"), value: detail(question.details, "city", "?") },
    { label: t("play.facts.founded"), value: String(detail(question.details, "founded", "?")) },
  ];
  const revealed = feedback ? 3 : stage;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5 shadow-sm" style={{ borderColor: `${ACCENT}33` }}>
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest mb-3" style={{ color: ACCENT }}>
          <Shield className="w-4 h-4" /> {t("play.crest.label")} · {question.questionNumber}
        </p>
        <div className="flex items-center gap-5">
          <DrawnCrest colors={colors} initials={detail(question.details, "initials", "")} showInitials={revealed >= 3} pixelated={revealed === 0} />
          <div className="flex-1 space-y-3">
            {facts.map((fact, i) => (
              <div key={fact.label}>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">{fact.label}</p>
                {revealed > i ? (
                  <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-bold text-foreground">
                    {fact.value}
                  </motion.p>
                ) : (
                  <p className="font-bold text-muted-foreground/40">• • •</p>
                )}
              </div>
            ))}
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">{t("play.facts.colors")}</p>
              <div className="flex gap-1.5 mt-1">
                {colors.map((c) => (
                  <span key={c} className="w-5 h-5 rounded-full border border-black/10" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!feedback && stage < 3 && (
        <RevealButton accent={ACCENT} onClick={() => setStage((s) => s + 1)} disabled={busy}>
          {t(["play.crest.clear", "play.crest.showYear", "play.crest.showInitials"][stage])}
        </RevealButton>
      )}

      <ChoiceButtons options={question.options ?? []} feedback={feedback} picked={picked} disabled={busy} accent={ACCENT} onAnswer={onAnswer} layout="grid" />

      {feedback && <ResultBanner correct={feedback.isCorrect}>{feedback.isCorrect ? t("play.crest.right") : t("play.itWas", { answer: feedback.correctAnswer })}</ResultBanner>}
    </div>
  );
}
