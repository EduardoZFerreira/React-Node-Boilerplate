import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/ui/TableSkeleton";
import { useTenantsQuery } from "../../queries/tenants";
import { useTenantUsersQuery } from "../../queries/tenantUsers";
import { useAuthStore } from "../../store/authStore";

const PAGE_SIZE = 10;

export function TenantUsersListPage() {
  const { t } = useTranslation("tenant");
  const user = useAuthStore((state) => state.user);
  const isAdmin = Boolean(user?.roles.includes("Admin"));

  const [page, setPage] = useState(1);
  const [tenantId, setTenantId] = useState("");

  const { data: tenantsPage } = useTenantsQuery(1, 100, { enabled: isAdmin });
  const effectiveTenantId = isAdmin ? tenantId || undefined : undefined;
  const shouldFetch = !isAdmin || Boolean(effectiveTenantId);
  const { data, isLoading, isError } = useTenantUsersQuery(page, PAGE_SIZE, effectiveTenantId, {
    enabled: shouldFetch,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("users.pageTitle")}</h1>
        {isAdmin ? (
          <select
            value={tenantId}
            onChange={(event) => {
              setTenantId(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">{t("users.selectTenantPlaceholder")}</option>
            {(tenantsPage?.tenants ?? []).map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {!shouldFetch ? (
        <p className="text-slate-500">{t("users.selectTenantPrompt")}</p>
      ) : isLoading ? (
        <TableSkeleton columns={3} />
      ) : isError ? (
        <p className="text-red-600">{t("common:errors.generic")}</p>
      ) : data && data.users.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">{t("users.columns.name")}</th>
                <th className="px-4 py-3 font-medium">{t("users.columns.email")}</th>
                <th className="px-4 py-3 font-medium">{t("users.columns.roles")}</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((tenantUser) => (
                <tr key={tenantUser.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {tenantUser.name} {tenantUser.surname}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{tenantUser.email}</td>
                  <td className="px-4 py-3 text-slate-600">{tenantUser.roles.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500">{t("users.empty")}</p>
      )}

      {shouldFetch && data ? <Pagination page={data.page} pages={data.pages} onPageChange={setPage} /> : null}
    </div>
  );
}
