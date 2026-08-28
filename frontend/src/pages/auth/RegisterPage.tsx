import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { register as registerRequest } from "../../api/auth";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Input } from "../../components/ui/Input";
import { ApiError } from "../../types/api";

// Mirrors backend/src/schemas/userSchema.ts's passwordRegex — client-side check
// is UX only, the backend remains the authority (and applies the same rule,
// skippable there via BYPASS_PASSWORD_STRENGTH_VALIDATION).
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

interface RegisterForm {
  name: string;
  surname: string;
  email: string;
  password: string;
}

const EMPTY_FORM: RegisterForm = { name: "", surname: "", email: "", password: "" };

export function RegisterPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(key: keyof RegisterForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim() || !form.password) {
      return t("register.validation.required");
    }
    if (!EMAIL_REGEX.test(form.email)) {
      return t("register.validation.invalidEmail");
    }
    if (!PASSWORD_REGEX.test(form.password)) {
      return t("register.validation.invalidPassword");
    }
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await registerRequest(form);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      const message = err instanceof ApiError ? err.errors.join(" ") : t("register.validation.required");
      setError(`${t("register.errorPrefix")}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold text-slate-900">{t("register.title")}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label={t("register.nameLabel")} htmlFor="name">
          <Input id="name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
        </FormField>
        <FormField label={t("register.surnameLabel")} htmlFor="surname">
          <Input
            id="surname"
            value={form.surname}
            onChange={(event) => update("surname", event.target.value)}
            required
          />
        </FormField>
        <FormField label={t("register.emailLabel")} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </FormField>
        <FormField label={t("register.passwordLabel")} htmlFor="password" hint={t("register.passwordHint")}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            required
          />
        </FormField>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("register.submitting") : t("register.submit")}
        </Button>
      </form>

      <p className="text-sm text-slate-600">
        {t("register.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-slate-900 hover:underline">
          {t("register.signInInstead")}
        </Link>
      </p>
    </div>
  );
}
