import { useState } from "react";
import { ShieldCheck, User } from "lucide-react";
import { authApi } from "../api/api";
import { SessionUser } from "../api/client";
import { errorMessage } from "../api/hooks";
import GoogleButton from "./GoogleButton";
import AuthLayout from "./layout/AuthLayout";
import { ErrorBox, FormField, TextInput } from "./shared/form";
import { useTranslation } from "react-i18next";

type Role = "player" | "admin";

interface SignInScreenProps {
  onBack: () => void;
  onSignIn: (user: SessionUser) => void;
  onGoToRegister: () => void;
  onForgotPassword: () => void;
}

export default function SignInScreen({ onBack, onSignIn, onGoToRegister, onForgotPassword }: SignInScreenProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("player");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // RF-025 a RF-034: el backend valida credenciales, el rol real y que la cuenta esté activa.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await authApi.login(email, password, role);
      onSignIn(session.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectRole = (next: Role) => {
    setRole(next);
    setError(null);
  };

  const isAdmin = role === "admin";

  return (
    <AuthLayout
      title={isAdmin ? t("signIn.adminTitle") : t("signIn.title")}
      titleIcon={isAdmin && <ShieldCheck className="w-6 h-6 text-accent" />}
      onBack={onBack}
      tone={isAdmin ? "secondary" : "primary"}
    >
      {/* Role Toggle */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2.5">{t("signIn.accessType")}</p>
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => selectRole("player")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              !isAdmin ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            {t("signIn.player")}
          </button>
          <button
            type="button"
            onClick={() => selectRole("admin")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isAdmin ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t("signIn.admin")}
          </button>
        </div>
        {isAdmin && <p className="text-xs text-muted-foreground mt-2 text-center">{t("signIn.adminNotice")}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <FormField htmlFor="email" label={isAdmin ? t("signIn.adminEmail") : t("auth.email")}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isAdmin ? "admin@footballmaestro.com" : t("auth.emailPlaceholder")}
            required
            tone={isAdmin ? "secondary" : "primary"}
          />
        </FormField>

        {/* Password */}
        <FormField htmlFor="password" label={t("auth.password")}>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            tone={isAdmin ? "secondary" : "primary"}
          />
        </FormField>

        {/* Forgot password */}
        <div className="text-right">
          <button type="button" onClick={onForgotPassword} className="text-sm text-primary hover:text-secondary font-medium">
            {t("signIn.forgotPassword")}
          </button>
        </div>

        {/* RNF-USA-03: error claro, sin bloquear el formulario */}
        <ErrorBox message={error} />

        {/* Sign In button */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3.5 rounded-xl font-semibold text-base shadow-md transition-colors mt-2 disabled:opacity-60 ${
            isAdmin ? "bg-secondary text-white hover:bg-primary" : "bg-primary text-primary-foreground hover:bg-secondary"
          }`}
        >
          {submitting ? t("signIn.signingIn") : isAdmin ? t("signIn.accessAdmin") : t("signIn.submit")}
        </button>

        {/* Divider — only for regular users */}
        {!isAdmin && (
          <>
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">{t("common.or")}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <GoogleButton onSignedIn={onSignIn} />
          </>
        )}
      </form>

      {/* Register link — only for regular users */}
      {!isAdmin && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("signIn.noAccount")}{" "}
            <button onClick={onGoToRegister} className="text-primary hover:text-secondary font-semibold">
              {t("signIn.createOne")}
            </button>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
