import { useState } from "react";
import { KeyRound, Languages, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usersApi } from "../api/api";
import { errorMessage, useApi } from "../api/hooks";
import LoadState from "./LoadState";
import LanguageSwitcher from "./shared/LanguageSwitcher";
import PageHeader from "./layout/PageHeader";
import PlayerLayout from "./layout/PlayerLayout";
import { ErrorBox, FormField, TextInput } from "./shared/form";
import { useTranslation } from "react-i18next";

/** Palabra que se escribe para confirmar el borrado de una cuenta sin contraseña (Google). */
const DELETE_WORD = "DELETE";

interface AccountSettingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  /** Tras cambiar la contraseña o borrar la cuenta, la sesión ya no es válida. */
  onSignedOut: () => void;
}

/** "Account Settings" (RF-112): cambiar contraseña y eliminar la cuenta (Ley 1581, derecho de supresión). */
export default function AccountSettingsScreen({ onBack, onNavigate, onSignedOut }: AccountSettingsScreenProps) {
  const { t } = useTranslation();
  const profile = useApi(usersApi.me);
  const me = profile.data;

  return (
    <PlayerLayout active="profile" onNavigate={onNavigate}>
      <div className="max-w-3xl space-y-6">
        <PageHeader title={t("profile.accountSettings")} back={{ label: t("nav.profile"), onClick: onBack }} />
        <LoadState loading={profile.loading && !me} error={profile.error} onRetry={profile.reload} />

        {me && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("auth.email")}</p>
                  <p className="font-medium text-foreground truncate">{me.email}</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Languages className="w-5 h-5 text-primary" />
                </div>
                <p className="flex-1 font-medium text-foreground">{t("language.label")}</p>
                <LanguageSwitcher />
              </div>
            </div>

            <ChangePassword hasPassword={me.hasPassword} onSignedOut={onSignedOut} />
            <DeleteAccount hasPassword={me.hasPassword} onSignedOut={onSignedOut} />
          </>
        )}
      </div>
    </PlayerLayout>
  );
}

function ChangePassword({ hasPassword, onSignedOut }: { hasPassword: boolean; onSignedOut: () => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setError(t("account.passwordsDontMatch"));
      return;
    }
    if (next === current) {
      setError(t("account.samePassword"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await usersApi.changePassword(current, next);
      // La API cierra todas las sesiones de la cuenta, incluida esta.
      toast.success(t("account.passwordChanged"));
      onSignedOut();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-primary" />
        {t("account.changePassword")}
      </h3>
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        {hasPassword ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: "currentPassword", label: t("account.currentPassword"), value: current, set: setCurrent, autoComplete: "current-password", min: 1 },
              { id: "newPassword", label: t("reset.newPassword"), value: next, set: setNext, autoComplete: "new-password", min: 8 },
              { id: "confirmPassword", label: t("account.confirmNewPassword"), value: confirm, set: setConfirm, autoComplete: "new-password", min: 8 },
            ].map(({ id, label, value, set, autoComplete, min }) => (
              <FormField key={id} htmlFor={id} label={label}>
                <TextInput
                  id={id}
                  type="password"
                  autoComplete={autoComplete}
                  minLength={min}
                  maxLength={72}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>
            ))}
            <p className="text-xs text-muted-foreground">{t("account.passwordHint")}</p>
            <ErrorBox message={error} />
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-md hover:bg-secondary transition-colors disabled:opacity-60"
            >
              {saving ? t("common.saving") : t("account.changePasswordButton")}
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">{t("account.googleNoPassword")}</p>
        )}
      </div>
    </section>
  );
}

function DeleteAccount({ hasPassword, onSignedOut }: { hasPassword: boolean; onSignedOut: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = hasPassword ? confirmation.length > 0 : confirmation === DELETE_WORD;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDelete) return;
    setError(null);
    setDeleting(true);
    try {
      await usersApi.deleteAccount(hasPassword ? confirmation : undefined);
      toast.success(t("account.deleted"));
      onSignedOut();
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
        <Trash2 className="w-5 h-5" />
        {t("account.deleteAccount")}
      </h3>
      <div className="bg-card border border-red-200 rounded-xl p-4 shadow-sm space-y-4">
        <p className="text-sm text-muted-foreground">{t("account.deleteWarning")}</p>

        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className="w-full border border-red-300 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
            {t("account.deleteMyAccount")}
          </button>
        ) : (
          <form onSubmit={handleDelete} className="space-y-4">
            <FormField htmlFor="deleteConfirmation" label={hasPassword ? t("account.confirmWithPassword") : t("account.confirmWithWord", { word: DELETE_WORD })}>
              <TextInput
                id="deleteConfirmation"
                type={hasPassword ? "password" : "text"}
                autoComplete={hasPassword ? "current-password" : "off"}
                maxLength={72}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={hasPassword ? "••••••••" : DELETE_WORD}
                required
              />
            </FormField>
            <ErrorBox message={error} />
            <button
              type="submit"
              disabled={deleting || !canDelete}
              className="w-full bg-red-600 text-white py-3.5 rounded-xl font-semibold shadow-md hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {deleting ? t("account.deleting") : t("account.deletePermanently")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmation("");
                setError(null);
              }}
              className="w-full text-muted-foreground py-3 rounded-xl font-medium hover:bg-muted transition-colors"
            >
              {t("common.cancel")}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
