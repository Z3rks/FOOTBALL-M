import { ReactNode } from "react";
import { ArrowLeft, Brain, Coins, Newspaper, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../shared/LanguageSwitcher";

interface AuthLayoutProps {
  /** Título del formulario; la Bienvenida no lleva (tiene su propio bloque). */
  title?: ReactNode;
  /** Ícono a la derecha del título (ej. el escudo del acceso Admin). */
  titleIcon?: ReactNode;
  onBack?: () => void;
  /** "secondary" pinta el panel de presentación con el color del portal de administración. */
  tone?: "primary" | "secondary";
  /** Ancho del formulario: el registro tiene más campos. */
  width?: "sm" | "md";
  children: ReactNode;
}

/** Líneas de la cancha, de fondo en el panel de presentación. */
const FIELD_PATTERN = {
  backgroundImage:
    "repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.06) 50px, rgba(255,255,255,0.06) 51px)," +
    "repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.06) 50px, rgba(255,255,255,0.06) 51px)",
};

/**
 * Estructura de las pantallas de acceso (Bienvenida, iniciar sesión, registro y recuperar
 * contraseña): presentación de la app a la izquierda en escritorio y el formulario a la derecha.
 * En celular solo se ve el formulario.
 */
export default function AuthLayout({ title, titleIcon, onBack, tone = "primary", width = "sm", children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const features = [
    { icon: Brain, title: t("welcome.features.games"), text: t("welcome.features.gamesText") },
    { icon: Newspaper, title: t("welcome.features.news"), text: t("welcome.features.newsText") },
    { icon: Coins, title: t("welcome.features.credits"), text: t("welcome.features.creditsText") },
  ];
  const gradient = tone === "secondary" ? "from-secondary to-primary" : "from-primary to-secondary";

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Presentación (solo en pantallas grandes) */}
      <section className={`hidden lg:flex flex-col justify-between bg-gradient-to-br ${gradient} p-12 text-white relative overflow-hidden transition-colors`}>
        <div className="absolute inset-0" style={FIELD_PATTERN} />
        <div className="relative flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-accent" />
          </span>
          <span className="text-xl font-bold">Football Maestro</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight mb-4">{t("welcome.subtitle")}</h1>
          <p className="text-white/80 mb-10">{t("welcome.footer")}</p>
          <ul className="space-y-5">
            {features.map(({ icon: Icon, title: feature, text }) => (
              <li key={feature} className="flex gap-4">
                <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-accent" />
                </span>
                <span>
                  <span className="block font-semibold">{feature}</span>
                  <span className="block text-sm text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© Football Maestro</p>
      </section>

      {/* Formulario */}
      <section className="flex flex-col px-6 py-6 min-h-screen lg:min-h-0">
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 p-2 -ml-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </button>
          ) : (
            <span />
          )}
          <LanguageSwitcher />
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className={`w-full ${width === "md" ? "max-w-md" : "max-w-sm"}`}>
            {title && (
              <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground mb-6">
                {title}
                {titleIcon}
              </h2>
            )}
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
