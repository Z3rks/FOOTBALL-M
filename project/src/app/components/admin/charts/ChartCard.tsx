import { ReactNode, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadState from "../../LoadState";

/** Estado de la consulta que alimenta la gráfica (lo que devuelve useApi). */
export interface ChartQuery {
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export interface ChartTable {
  columns: string[];
  rows: Array<Array<string | number>>;
}

interface ChartCardProps {
  title: string;
  /** La pregunta que responde la gráfica, en lenguaje sencillo. */
  question: string;
  /** Consulta que alimenta la gráfica: carga, error y reintentar. */
  query: ChartQuery;
  /** Sin datos que mostrar (el período no tiene actividad). */
  empty: boolean;
  /** Leyenda para 2 o más series (una sola serie no la necesita: el título la nombra). */
  legend?: Array<{ label: string; color: string }>;
  /** La misma información en una tabla (accesible y con los valores exactos). */
  table?: ChartTable;
  /** Controles propios de la gráfica, a la derecha del título (ej. elegir un minijuego). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Tarjeta común de las gráficas del panel: título, pregunta que responde, leyenda, estado de
 * carga, mensaje cuando no hay datos y el botón "Ver tabla". Al recargar (cambio de período) se
 * mantiene la gráfica anterior atenuada en lugar de parpadear.
 */
export default function ChartCard({ title, question, query, empty, legend, table, action, children }: ChartCardProps) {
  const { t } = useTranslation();
  const { loading, error, reload } = query;
  const [showTable, setShowTable] = useState(false);
  const firstLoad = loading && empty;

  return (
    <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{question}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {action}
          {table && !empty && (
            <button
              onClick={() => setShowTable((v) => !v)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={showTable ? t("admin.charts.showChart") : t("admin.charts.showTable")}
              title={showTable ? t("admin.charts.showChart") : t("admin.charts.showTable")}
            >
              {showTable ? <BarChart3 className="w-4 h-4" /> : <Table2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <LoadState loading={firstLoad} error={error} onRetry={reload} />

      {!firstLoad && !error && empty && <p className="text-xs text-muted-foreground text-center py-6">{t("admin.charts.empty")}</p>}

      {!firstLoad && !error && !empty && (
        <div className={`transition-opacity ${loading ? "opacity-50" : ""}`}>
          {legend && legend.length > 1 && !showTable && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
              {legend.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          )}
          {showTable && table ? <DataTable table={table} /> : children}
        </div>
      )}
    </section>
  );
}

function DataTable({ table }: { table: ChartTable }) {
  return (
    <div className="max-h-72 overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {table.columns.map((c, i) => (
              <th key={c} className={`py-1.5 font-semibold text-muted-foreground ${i ? "text-right" : "text-left"}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r} className="border-b border-border/50 last:border-0">
              {row.map((cell, i) => (
                <td key={i} className={`py-1.5 text-foreground ${i ? "text-right tabular-nums" : "text-left"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
