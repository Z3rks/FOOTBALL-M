import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link2 } from "lucide-react";
import { ResultBanner, StatementCard } from "./parts";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

const ACCENT = "#EA580C";
/** Color de cada grupo al revelarse. */
const GROUP_COLORS = [
  { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
];

function parseGroups(value: string): Array<[string, string[]]> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Array<[string, string[]]>) : null;
  } catch {
    return null;
  }
}

/** Connections: en un tablero de 8 jugadores hay 2 grupos de 4; se elige uno de los grupos. */
export default function ConnectionsView({ question, feedback, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const tiles = question.options ?? [];
  const [selected, setSelected] = useState<string[]>([]);
  const groups = useMemo(() => (feedback ? parseGroups(feedback.correctAnswer) : null), [feedback]);
  const groupOf = (name: string) => groups?.findIndex(([, members]) => members.includes(name)) ?? -1;

  const toggle = (name: string) => {
    if (busy || feedback) return;
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : s.length < 4 ? [...s, name] : s));
  };

  return (
    <div className="space-y-5">
      <StatementCard label={`${t("play.connections.label")} · ${question.questionNumber}`} icon={<Link2 className="w-4 h-4" />} accent={ACCENT} hint={t("play.connections.hint")}>
        {t("play.connections.pick")}
      </StatementCard>

      <motion.div
        className="grid grid-cols-2 gap-2.5"
        animate={feedback && !feedback.isCorrect ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        {tiles.map((name, i) => {
          const isSelected = selected.includes(name);
          const group = groupOf(name);
          const color = group >= 0 ? GROUP_COLORS[group % GROUP_COLORS.length] : null;
          return (
            <motion.button
              key={name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: isSelected && !feedback ? 1.03 : 1 }}
              transition={{ delay: feedback ? 0 : i * 0.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(name)}
              disabled={busy || !!feedback}
              className="h-16 rounded-xl border-2 font-bold text-sm uppercase tracking-wide transition-colors"
              style={
                color
                  ? { background: color.bg, borderColor: color.border, color: color.text }
                  : isSelected
                    ? { background: ACCENT, borderColor: ACCENT, color: "#fff" }
                    : { background: "#FFF7ED", borderColor: "#FED7AA", color: "#7C2D12" }
              }
            >
              {name}
            </motion.button>
          );
        })}
      </motion.div>

      {!feedback && (
        <div className="flex gap-2">
          <button onClick={() => setSelected([])} disabled={busy || selected.length === 0} className="px-4 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground disabled:opacity-40">
            {t("common.clear")}
          </button>
          <button
            onClick={() => onAnswer(JSON.stringify(selected))}
            disabled={busy || selected.length !== 4}
            className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-md disabled:opacity-40 transition-opacity"
            style={{ background: ACCENT }}
          >
            {busy ? t("common.checking") : t("play.connections.submit", { count: selected.length })}
          </button>
        </div>
      )}

      {feedback && groups && (
        <ResultBanner correct={feedback.isCorrect}>
          <p className="mb-2">{feedback.isCorrect ? t("play.connections.right") : t("play.connections.wrong")}</p>
          <ul className="space-y-1 font-normal">
            {groups.map(([label, members], i) => (
              <li key={label}>
                <span className="font-bold" style={{ color: GROUP_COLORS[i % GROUP_COLORS.length].text }}>
                  {label}:
                </span>{" "}
                {members.join(", ")}
              </li>
            ))}
          </ul>
        </ResultBanner>
      )}
    </div>
  );
}
