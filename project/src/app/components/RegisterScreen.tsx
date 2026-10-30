import { useState } from "react";
import { authApi } from "../api/api";
import { SessionUser } from "../api/client";
import { errorMessage } from "../api/hooks";
import GoogleButton from "./GoogleButton";
import AuthLayout from "./layout/AuthLayout";
import { ErrorBox, FormField, TextInput } from "./shared/form";
import { useTranslation } from "react-i18next";

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: (user: SessionUser) => void;
  onGoToSignIn: () => void;
}

export default function RegisterScreen({ onBack, onRegister, onGoToSignIn }: RegisterScreenProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // RF-045 / RNF-UI-029: alerta nativa si las contraseñas no coinciden.
    if (password !== confirmPassword) {
      alert(t("auth.passwordsDontMatch"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const session = await authApi.register(username, email, password, consent);
      onRegister(session.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={t("register.title")} onBack={onBack} width="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username */}
        <FormField htmlFor="username" label={t("register.username")}>
          <TextInput
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="footballfan123"
            pattern="[A-Za-z0-9_]{3,30}"
            title={t("register.usernameRule")}
            required
          />
        </FormField>

        {/* Email */}
        <FormField htmlFor="email" label={t("auth.email")}>
          <TextInput id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} required />
        </FormField>

        {/* Password */}
        <FormField htmlFor="password" label={t("auth.password")}>
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </FormField>

        {/* Confirm Password */}
        <FormField htmlFor="confirmPassword" label={t("auth.confirmPassword")}>
          <TextInput
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </FormField>

        {/* Ley 1581 (RNF-SEC-07): consentimiento explícito */}
        <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--primary)] flex-shrink-0" required />
          <span>{t("register.consent")}</span>
        </label>

        <ErrorBox message={error} />

        {/* Create Account button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-base shadow-md hover:bg-secondary transition-colors mt-6 disabled:opacity-60"
        >
          {submitting ? t("register.creating") : t("register.submit")}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google sign up */}
        <GoogleButton onSignedIn={onRegister} />
      </form>

      {/* Sign in link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t("register.haveAccount")}{" "}
          <button onClick={onGoToSignIn} className="text-primary hover:text-secondary font-semibold">
            {t("register.signIn")}
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
