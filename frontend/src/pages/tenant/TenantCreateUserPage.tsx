import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Input } from "../../components/ui/Input";
import { useCreateTenantUserMutation } from "../../queries/tenantUsers";
import { useTenantsQuery } from "../../queries/tenants";
import { useAuthStore } from "../../store/authStore";
import { ApiError } from "../../types/api";

const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

interface TenantUserForm {
  name: string;
  surname: string;
  email: string;
  password: string;
  tenantId: string;
}

const EMPTY_FORM: TenantUserForm = { name: "", surname: "", email: "", password: "", tenantId: "" };

export function TenantCreateUserPage() {
  const { t } = useTranslation("tenant");
  const user = useAuthStore((state) => state.user);
  const isAdmin = Boolean(user?.roles.includes("Admin"));

  const { data: tenantsPage } = useTenantsQuery(1, 100, { enabled: isAdmin });
  const createMutation = useCreateTenantUserMutation();

  const [form, setForm] = useState<TenantUserForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update(key: keyof TenantUserForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim() || !form.password) {
      return t("createUser.validation.required");
    }
    if (!PASSWORD_REGEX.test(form.password)) {
      return t("createUser.validation.invalidPassword");
    }
    if (isAdmin && !form.tenantId) {
      return t("createUser.validation.tenantRequired");
    }
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess(false);
      return;
    }

    setError(null);
    try {
      await createMutation.mutateAsync({
        name: form.name,
        surname: form.surname,
        email: form.email,
        password: form.password,
        ...(isAdmin ? { tenantId: form.tenantId } : {}),
      });
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      const message = err instanceof ApiError ? err.errors.join(" ") : t("createUser.validation.required");
      setError(`${t("createUser.errorPrefix")}: ${message}`);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">{t("createUser.title")}</h1>

      {success ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{t("createUser.success")}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label={t("createUser.nameLabel")} htmlFor="name">
          <Input id="name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
        </FormField>
        <FormField label={t("createUser.surnameLabel")} htmlFor="surname">
          <Input
            id="surname"
            value={form.surname}
            onChange={(event) => update("surname", event.target.value)}
            required
          />
        </FormField>
        <FormField label={t("createUser.emailLabel")} htmlFor="email">
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </FormField>
        <FormField label={t("createUser.passwordLabel")} htmlFor="password">
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            required
          />
        </FormField>
        {isAdmin ? (
          <FormField label={t("createUser.tenantLabel")} htmlFor="tenantId">
            <select
              id="tenantId"
              value={form.tenantId}
              onChange={(event) => update("tenantId", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              required
            >
              <option value="">{t("createUser.selectTenant")}</option>
              {(tenantsPage?.tenants ?? []).map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={createMutation.isPending}>
          {t("createUser.submit")}
        </Button>
      </form>
    </div>
  );
}
