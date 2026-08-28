import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { changePassword } from "../api/auth";
import { ApiError } from "../types/api";
import { Button } from "./ui/Button";
import { FormField } from "./ui/FormField";
import { Input } from "./ui/Input";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { t } = useTranslation("auth");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!currentPassword || !newPassword) {
      setError(t("changePassword.validation.required"));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      onSuccess?.();
    } catch (err) {
      const message = err instanceof ApiError ? err.errors.join(" ") : t("changePassword.validation.required");
      setError(`${t("changePassword.errorPrefix")}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label={t("changePassword.currentPasswordLabel")} htmlFor="currentPassword">
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </FormField>
      <FormField
        label={t("changePassword.newPasswordLabel")}
        htmlFor="newPassword"
        hint={t("changePassword.passwordHint")}
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
      {success ? <p className="text-sm text-green-700">{t("changePassword.success")}</p> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("changePassword.submitting") : t("changePassword.submit")}
      </Button>
    </form>
  );
}
