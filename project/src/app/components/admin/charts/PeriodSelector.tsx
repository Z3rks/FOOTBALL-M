import { useTranslation } from "react-i18next";

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

/** Filtro de período (últimos 7, 30 o 90 días). Va en una sola fila, arriba de todas las gráficas que afecta. */
export default function PeriodSelector({ value, onChange }: { value: Period; onChange: (period: Period) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between sm:justify-start gap-3">
      <span className="text-xs font-semibold text-muted-foreground">{t("admin.charts.period")}</span>
      <div className="inline-flex rounded-full bg-muted p-1" role="group" aria-label={t("admin.charts.period")}>
        {PERIODS.map((days) => (
          <button
            key={days}
            onClick={() => onChange(days)}
            aria-pressed={value === days}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${value === days ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("admin.charts.days", { count: days })}
          </button>
        ))}
      </div>
    </div>
  );
}
