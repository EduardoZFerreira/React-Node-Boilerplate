import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Input } from "../../components/ui/Input";
import { useAuthStore } from "../../store/authStore";
import { ApiError } from "../../types/api";

interface LocationState {
  from?: string;
  registered?: boolean;
}

export function LoginPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = location.state as LocationState | null;
  const redirectTo = state?.from ?? "/app";
  const justRegistered = Boolean(state?.registered);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email || !password) {
      setError(t("login.genericValidation"));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.errors.join(" ") : t("login.genericValidation");
      setError(`${t("login.errorPrefix")}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold text-slate-900">{t("login.title")}</h1>

      {justRegistered ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {t("login.registeredSuccess")}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label={t("login.emailLabel")} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </FormField>
        <FormField label={t("login.passwordLabel")} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </FormField>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>

      <p className="text-sm text-slate-600">
        {t("login.noAccount")}{" "}
        <Link to="/register" className="font-medium text-slate-900 hover:underline">
          {t("login.createAccount")}
        </Link>
      </p>
    </div>
  );
}
