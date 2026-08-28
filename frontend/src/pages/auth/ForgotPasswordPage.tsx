import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { forgotPassword } from "../../api/auth";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Input } from "../../components/ui/Input";

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPassword({ email });
    } finally {
      // Always show the same generic outcome, whether or not the email is
      // registered or the request even succeeded — never reveal which.
      setIsSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold text-slate-900">{t("forgotPassword.title")}</h1>

      {submitted ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{t("forgotPassword.success")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label={t("forgotPassword.emailLabel")} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </FormField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
          </Button>
        </form>
      )}

      <Link to="/login" className="text-sm font-medium text-slate-900 hover:underline">
        {t("forgotPassword.backToLogin")}
      </Link>
    </div>
  );
}
