import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { resetPassword } from "../../api/auth";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Input } from "../../components/ui/Input";
import { ApiError } from "../../types/api";

// Mirrors backend/src/schemas/userSchema.ts's passwordRegex — UX only, the
// backend re-validates regardless.
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

export function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-24 text-center">
        <p className="text-sm text-red-600">{t("resetPassword.invalidLink")}</p>
        <Link to="/forgot-password" className="text-sm font-medium text-slate-900 hover:underline">
          {t("resetPassword.backToForgot")}
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError(t("register.validation.invalidPassword"));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword({ token: token as string, newPassword });
      navigate("/login", { state: { passwordReset: true } });
    } catch (err) {
      const message = err instanceof ApiError ? err.errors.join(" ") : t("resetPassword.invalidLink");
      setError(`${t("resetPassword.errorPrefix")}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold text-slate-900">{t("resetPassword.title")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label={t("resetPassword.newPasswordLabel")}
          htmlFor="newPassword"
          hint={t("resetPassword.passwordHint")}
        >
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </FormField>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("resetPassword.submitting") : t("resetPassword.submit")}
        </Button>
      </form>
    </div>
  );
}
