import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage, type Language } from "../../i18n";

/** Selector de idioma (EN | ES). Cambia toda la app al instante y se recuerda en el navegador. */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n, t } = useTranslation();
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm ${className}`} role="group" aria-label={t("language.label")}>
      <Languages className="w-4 h-4 text-muted-foreground ml-1.5" aria-hidden />
      {LANGUAGES.map(({ code, label }) => {
        const active = i18n.language === code;
        return (
          <button
            key={code}
            onClick={() => setLanguage(code as Language)}
            aria-pressed={active}
            title={label}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
