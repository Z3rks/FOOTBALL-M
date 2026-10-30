import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SessionUser } from "../api/client";
import GoogleButton from "./GoogleButton";
import AuthLayout from "./layout/AuthLayout";

interface WelcomeScreenProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
  onGoogleSignIn: (user: SessionUser) => void;
}

/** Pantalla de bienvenida (RF-004 a RF-011): presentación de la app a la izquierda y acceso a la derecha. */
export default function WelcomeScreen({ onSignIn, onCreateAccount, onGoogleSignIn }: WelcomeScreenProps) {
  const { t } = useTranslation();

  return (
    <AuthLayout>
      <div className="lg:hidden flex flex-col items-center mb-8">
        <div className="bg-primary rounded-full p-5 mb-4 shadow-lg">
          <Trophy className="w-12 h-12 text-accent" />
        </div>
        <h1 className="text-3xl font-bold text-primary text-center">Football Maestro</h1>
        <p className="text-muted-foreground text-center mt-1">{t("welcome.subtitle")}</p>
      </div>

      <h2 className="hidden lg:block text-2xl font-bold text-foreground mb-2">{t("welcome.getStarted")}</h2>
      <p className="hidden lg:block text-sm text-muted-foreground mb-8">{t("welcome.getStartedText")}</p>

      <div className="space-y-3">
        <button onClick={onSignIn} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-lg shadow-md hover:bg-secondary transition-colors">
          {t("welcome.signIn")}
        </button>
        <button
          onClick={onCreateAccount}
          className="w-full bg-white text-primary border-2 border-primary py-3.5 rounded-xl font-semibold text-lg hover:bg-primary/5 transition-colors"
        >
          {t("welcome.createAccount")}
        </button>
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">{t("common.or")}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <GoogleButton onSignedIn={onGoogleSignIn} />
      </div>
      <p className="lg:hidden text-center text-sm text-muted-foreground mt-10">{t("welcome.footer")}</p>
    </AuthLayout>
  );
}
