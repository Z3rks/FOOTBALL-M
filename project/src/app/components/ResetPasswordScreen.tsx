import { useState } from "react";
import { KeyRound } from "lucide-react";
import { authApi } from "../api/api";
import { errorMessage } from "../api/hooks";
import { ErrorBox, FormField, TextInput } from "./shared/form";
import AuthLayout from "./layout/AuthLayout";
import { useTranslation } from "react-i18next";

/** Destino del enlace del correo: /reset-password?token=… (RF-038, RF-039). */
export default function ResetPasswordScreen({ token, onDone }: { token: string; onDone: () => void }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t("auth.passwordsDontMatch"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={t("reset.title")}>
      {done ? (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-semibold">{t("reset.updated")}</p>
          <p className="text-sm text-muted-foreground">{t("reset.sessionsClosed")}</p>
          <button onClick={onDone} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-md hover:bg-secondary transition-colors">
            {t("reset.goToSignIn")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { id: "password", label: t("reset.newPassword"), value: password, set: setPassword },
            { id: "confirmPassword", label: t("auth.confirmPassword"), value: confirmPassword, set: setConfirmPassword },
          ].map(({ id, label, value, set }) => (
            <FormField key={id} htmlFor={id} label={label}>
              <TextInput
                id={id}
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder="••••••••"
                required
              />
            </FormField>
          ))}
          <ErrorBox message={error} />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-base shadow-md hover:bg-secondary transition-colors disabled:opacity-60"
          >
            {submitting ? t("common.saving") : t("reset.submit")}
          </button>
          <button type="button" onClick={onDone} className="w-full text-muted-foreground py-3 rounded-xl font-medium hover:bg-muted transition-colors">
            {t("auth.backToSignIn")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
