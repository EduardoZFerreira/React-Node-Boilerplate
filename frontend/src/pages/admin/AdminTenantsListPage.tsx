import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/ui/TableSkeleton";
import { useTenantsQuery } from "../../queries/tenants";

const PAGE_SIZE = 10;

export function AdminTenantsListPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTenantsQuery(page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("tenants.pageTitle")}</h1>
        <Link to="/app/admin/tenants/new">
          <Button type="button">{t("tenants.createButton")}</Button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : isError ? (
        <p className="text-red-600">{t("common:errors.generic")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">{t("tenants.columns.name")}</th>
                <th className="px-4 py-3 font-medium">{t("tenants.columns.slug")}</th>
                <th className="px-4 py-3 font-medium">{t("tenants.columns.plan")}</th>
                <th className="px-4 py-3 font-medium">{t("tenants.columns.status")}</th>
                <th className="px-4 py-3 font-medium">{t("tenants.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {data?.tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{tenant.name}</td>
                  <td className="px-4 py-3 text-slate-600">{tenant.slug}</td>
                  <td className="px-4 py-3 text-slate-600">{tenant.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        tenant.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {tenant.isActive ? t("tenants.status.active") : t("tenants.status.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/app/admin/tenants/${tenant.id}/edit`}
                      state={{ tenant }}
                      className="text-slate-700 hover:underline"
                    >
                      {t("common:actions.edit")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data ? <Pagination page={data.page} pages={data.pages} onPageChange={setPage} /> : null}
    </div>
  );
}
