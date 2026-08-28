import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  useAddRoleMutation,
  useAdminUserQuery,
  useAssignTenantMutation,
  useRemoveRoleMutation,
  useRolesQuery,
} from "../../queries/adminUsers";
import { useTenantsQuery } from "../../queries/tenants";
import { ApiError } from "../../types/api";
import type { Role } from "../../types/auth";

export function AdminUserDetailPage() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: user, isLoading } = useAdminUserQuery(id);
  const { data: roleOptions } = useRolesQuery();
  const { data: tenantsPage } = useTenantsQuery(1, 100);

  const addRoleMutation = useAddRoleMutation();
  const removeRoleMutation = useRemoveRoleMutation();
  const assignTenantMutation = useAssignTenantMutation();

  const [roleToAdd, setRoleToAdd] = useState("");
  const [tenantToAssign, setTenantToAssign] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const availableRoles = (roleOptions ?? []).filter((role) => !user.roles.includes(role.title as Role));

  async function handleAddRole() {
    if (!roleToAdd || !id) return;
    try {
      await addRoleMutation.mutateAsync({ id, role: roleToAdd as Role });
      setRoleToAdd("");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors.join(" ") : t("common:errors.generic"));
    }
  }

  async function handleRemoveRole(role: Role) {
    if (!id) return;
    try {
      await removeRoleMutation.mutateAsync({ id, role });
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors.join(" ") : t("common:errors.generic"));
    }
  }

  async function handleAssignTenant() {
    if (!tenantToAssign || !id) return;
    try {
      await assignTenantMutation.mutateAsync({ id, tenantId: tenantToAssign });
      setTenantToAssign("");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.errors.join(" ") : t("common:errors.generic"));
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {user.name} {user.surname}
        </h1>
        <p className="text-sm text-slate-600">{user.email}</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("users.detail.rolesTitle")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {user.roles.map((role) => (
            <span
              key={role}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
            >
              {role}
              <button
                type="button"
                onClick={() => handleRemoveRole(role)}
                className="text-slate-400 hover:text-red-600"
                aria-label={t("users.detail.removeRole", { role })}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={roleToAdd}
            onChange={(event) => setRoleToAdd(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">{t("users.detail.selectRole")}</option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.title}>
                {role.title}
              </option>
            ))}
          </select>
          <Button type="button" onClick={handleAddRole} disabled={!roleToAdd || addRoleMutation.isPending}>
            {t("users.detail.addRole")}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("users.detail.tenantTitle")}
        </h2>
        <p className="text-sm text-slate-600">
          {user.tenantId
            ? (tenantsPage?.tenants.find((tenant) => tenant.id === user.tenantId)?.name ?? user.tenantId)
            : t("users.detail.noTenant")}
        </p>
        <div className="flex gap-2">
          <select
            value={tenantToAssign}
            onChange={(event) => setTenantToAssign(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">{t("users.detail.selectTenant")}</option>
            {(tenantsPage?.tenants ?? []).map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={handleAssignTenant}
            disabled={!tenantToAssign || assignTenantMutation.isPending}
          >
            {t("users.detail.assignTenant")}
          </Button>
        </div>
      </section>

      <Button type="button" variant="secondary" onClick={() => navigate("/app/admin/users")}>
        {t("users.detail.backToList")}
      </Button>
    </div>
  );
}
