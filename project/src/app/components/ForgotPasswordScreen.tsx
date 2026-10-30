import { useState } from "react";
import { MailCheck } from "lucide-react";
import { authApi } from "../api/api";
import { errorMessage } from "../api/hooks";
import AuthLayout from "./layout/AuthLayout";
import { ErrorBox, FormField, TextInput } from "./shared/form";
import { useTranslation } from "react-i18next";

/** RF-035 a RF-039: pide el enlace de recuperación. La API no revela si el email existe. */
export default function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={t("forgot.title")} onBack={onBack}>
      {sent ? (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
            <MailCheck className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-semibold">{t("forgot.checkEmail")}</p>
          <p className="text-sm text-muted-foreground">{t("forgot.sent", { email })}</p>
          <button onClick={onBack} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-md hover:bg-secondary transition-colors">
            {t("auth.backToSignIn")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-muted-foreground">{t("forgot.instructions")}</p>
          <FormField htmlFor="email" label={t("auth.email")}>
            <TextInput id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} required />
          </FormField>
          <ErrorBox message={error} />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-base shadow-md hover:bg-secondary transition-colors disabled:opacity-60"
          >
            {submitting ? t("forgot.sending") : t("forgot.submit")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
