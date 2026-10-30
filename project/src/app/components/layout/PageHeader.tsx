import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Botones o filtros a la derecha del título (ej. período, actualizar, CSV). */
  actions?: ReactNode;
  /** Subpáginas (ej. Editar perfil): enlace para volver a la página de la que salen. */
  back?: { label: string; onClick: () => void };
}

/** Título de una página de la app web, con su subtítulo y sus acciones. */
export default function PageHeader({ title, subtitle, actions, back }: PageHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-6">
      {back && (
        <button
          onClick={back.onClick}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-3"
          aria-label={`${t("common.back")}: ${back.label}`}
        >
          <ArrowLeft className="w-4 h-4" />
          {back.label}
        </button>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
