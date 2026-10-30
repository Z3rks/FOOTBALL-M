import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { TextInput } from "../shared/form";
import type { QuestionViewProps } from "./types";
import { useTranslation } from "react-i18next";

/** Estilo por defecto: opciones (o respuesta escrita) sobre tarjetas claras. */
export default function MultipleChoiceView({ question, feedback, picked, busy, onAnswer }: QuestionViewProps) {
  const { t } = useTranslation();
  const [freeText, setFreeText] = useState("");

  const optionStyle = (option: string) => {
    if (!feedback) return "bg-card border-border hover:border-primary hover:bg-primary/5";
    if (option === feedback.correctAnswer) return "bg-green-50 border-green-500 text-green-700";
    if (option === picked) return "bg-red-50 border-red-500 text-red-700";
    return "bg-card border-border opacity-60";
  };

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs text-muted-foreground font-semibold mb-2">{t("play.question", { n: question.questionNumber })}</p>
        {question.mediaUrl && <img src={question.mediaUrl} alt="" className="w-full h-40 object-cover rounded-xl mb-3" />}
        <p className="text-lg font-semibold text-foreground">{question.statement}</p>
      </div>

      {question.options ? (
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => onAnswer(option)}
              disabled={busy || !!feedback}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium transition-all active:scale-[0.98] ${optionStyle(option)}`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (freeText.trim()) onAnswer(freeText.trim());
          }}
          className="space-y-3"
        >
          <TextInput value={freeText} onChange={(e) => setFreeText(e.target.value)} disabled={!!feedback} placeholder={t("play.yourAnswer")} />
          {!feedback && (
            <button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-md hover:bg-secondary transition-colors disabled:opacity-60">
              {t("play.answer")}
            </button>
          )}
        </form>
      )}

      {feedback && (
        <div className={`flex items-center gap-3 rounded-xl p-4 ${feedback.isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {feedback.isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          <p className="text-sm font-medium">{feedback.isCorrect ? t("play.correct") : t("play.answerWas", { answer: feedback.correctAnswer })}</p>
        </div>
      )}
    </div>
  );
}
