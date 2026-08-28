import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { FormSkeleton } from "../../components/ui/FormSkeleton";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { useCreateTenantMutation, useTenantsQuery, useUpdateTenantMutation } from "../../queries/tenants";
import { ApiError } from "../../types/api";
import type { Tenant, TenantPlan } from "../../types/tenant";

const PLAN_OPTIONS: TenantPlan[] = ["free", "pro", "enterprise"];
const SLUG_REGEX = /^[a-z0-9-]+$/;

export function AdminTenantFormPage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // There's no GET /admin/tenants/:id endpoint — prefer the tenant handed via
  // router state (from the list page's Edit link) and fall back to a
  // full-list lookup only for a direct URL visit or a page refresh.
  const stateTenant = (location.state as { tenant?: Tenant } | null)?.tenant;
  const { data: tenantsPage } = useTenantsQuery(1, 100, { enabled: !stateTenant && isEdit });
  const fallbackTenant = tenantsPage?.tenants.find((tenant) => tenant.id === id);
  const existingTenant = stateTenant ?? fallbackTenant;

  const createMutation = useCreateTenantMutation();
  const updateMutation = useUpdateTenantMutation();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<TenantPlan>("free");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingTenant) {
      setName(existingTenant.name);
      setSlug(existingTenant.slug);
      setPlan(existingTenant.plan);
      setIsActive(existingTenant.isActive);
    }
  }, [existingTenant]);

  function validate(): string | null {
    if (!name.trim()) return t("tenants.validation.nameRequired");
    if (!isEdit && !SLUG_REGEX.test(slug)) return t("tenants.validation.invalidSlug");
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
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, input: { name, plan, isActive } });
      } else {
        await createMutation.mutateAsync({ name, slug, plan });
      }
      navigate("/app/admin/tenants");
    } catch (err) {
      const message = err instanceof ApiError ? err.errors.join(" ") : t("tenants.validation.nameRequired");
      setError(`${t("tenants.form.errorPrefix")}: ${message}`);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && !existingTenant) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <FormSkeleton fields={3} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        {isEdit ? t("tenants.form.editTitle") : t("tenants.form.createTitle")}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label={t("tenants.form.nameLabel")} htmlFor="name">
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </FormField>
        <FormField
          label={t("tenants.form.slugLabel")}
          htmlFor="slug"
          hint={isEdit ? t("tenants.form.slugImmutable") : undefined}
        >
          <Input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required disabled={isEdit} />
        </FormField>
        <FormField label={t("tenants.form.planLabel")} htmlFor="plan">
          <select
            id="plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value as TenantPlan)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {PLAN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FormField>
        {isEdit ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            {t("tenants.form.activeLabel")}
          </label>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? t("tenants.form.submitEdit") : t("tenants.form.submitCreate")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/app/admin/tenants")}>
            {t("tenants.form.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
