import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Estado de carga o de error (con "Try again") de una sección que lee de la API. */
export default function LoadState({ loading, error, onRetry, className = "" }: { loading: boolean; error: string | null; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation();
  if (error) {
    return (
      <div role="alert" className={`flex flex-col items-center gap-2 text-center text-sm text-muted-foreground py-6 ${className}`}>
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p>{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-primary font-semibold hover:text-secondary">
            {t("common.tryAgain")}
          </button>
        )}
      </div>
    );
  }
  if (loading) {
    return (
      <div className={`flex justify-center py-6 ${className}`} aria-label={t("common.loading")}>
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }
  return null;
}
