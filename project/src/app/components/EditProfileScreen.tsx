import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { usersApi } from "../api/api";
import { errorMessage, useApi } from "../api/hooks";
import { countries } from "../countries";
import { flag, initials } from "../format";
import LoadState from "./LoadState";
import PageHeader from "./layout/PageHeader";
import PlayerLayout from "./layout/PlayerLayout";
import { ErrorBox, FormField, SelectInput, TextInput } from "./shared/form";
import { useTranslation } from "react-i18next";

/** Mismas reglas que la API: 3-30 letras sin tilde, números o guion bajo (RNF-SEC-06). */
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;

/** "Edit Profile" (RF-112): nombre de usuario y país. */
export default function EditProfileScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (screen: string) => void }) {
  const { t, i18n } = useTranslation();
  const countryOptions = useMemo(() => countries(i18n.language), [i18n.language]);
  const profile = useApi(usersApi.me);
  const me = profile.data;
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    setUsername(me.username);
    setCountry(me.country ?? "");
  }, [me]);

  const trimmed = username.trim();
  const usernameValid = USERNAME_PATTERN.test(trimmed);
  const changed = !!me && (trimmed !== me.username || (country || null) !== me.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !changed) return;
    if (!usernameValid) {
      setError(t("editProfile.usernameInvalid"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await usersApi.updateProfile({
        ...(trimmed !== me.username && { username: trimmed }),
        ...((country || null) !== me.country && { country: country || null }),
      });
      toast.success(t("editProfile.updated"));
      onBack();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PlayerLayout active="profile" onNavigate={onNavigate}>
      <div className="max-w-xl">
        <PageHeader title={t("profile.editProfile")} back={{ label: t("nav.profile"), onClick: onBack }} />
        <LoadState loading={profile.loading && !me} error={profile.error} onRetry={profile.reload} />

        {me && (
          <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center font-bold text-2xl text-primary shadow-lg">{initials(trimmed || me.username)}</div>
              <p className="text-sm text-muted-foreground">
                {country ? `${flag(country)} ` : ""}
                {me.email}
              </p>
            </div>

            <FormField htmlFor="username" label={t("register.username")} hint={t("editProfile.usernameHint")} hintIsError={!!trimmed && !usernameValid}>
              <TextInput id="username" type="text" autoComplete="username" maxLength={30} value={username} onChange={(e) => setUsername(e.target.value)} required />
            </FormField>

            <FormField htmlFor="country" label={t("editProfile.country")} hint={t("editProfile.optional")}>
              <SelectInput id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">{t("editProfile.notSpecified")}</option>
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {flag(c.code)} {c.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <ErrorBox message={error} />

            <button
              type="submit"
              disabled={saving || !changed}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-base shadow-md hover:bg-secondary transition-colors disabled:opacity-60"
            >
              {saving ? t("common.saving") : t("editProfile.save")}
            </button>
            <button type="button" onClick={onBack} className="w-full text-muted-foreground py-3 rounded-xl font-medium hover:bg-muted transition-colors">
              {t("common.cancel")}
            </button>
          </form>
        )}
      </div>
    </PlayerLayout>
  );
}
