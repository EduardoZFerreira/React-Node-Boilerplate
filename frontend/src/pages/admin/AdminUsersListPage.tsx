import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/ui/TableSkeleton";
import { useAdminUsersQuery } from "../../queries/adminUsers";

const PAGE_SIZE = 10;

export function AdminUsersListPage() {
  const { t } = useTranslation("admin");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminUsersQuery(page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">{t("users.pageTitle")}</h1>

      {isLoading ? (
        <TableSkeleton columns={4} />
      ) : isError ? (
        <p className="text-red-600">{t("common:errors.generic")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">{t("users.columns.name")}</th>
                <th className="px-4 py-3 font-medium">{t("users.columns.email")}</th>
                <th className="px-4 py-3 font-medium">{t("users.columns.roles")}</th>
                <th className="px-4 py-3 font-medium">{t("users.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name} {user.surname}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/app/admin/users/${user.id}`} className="text-slate-700 hover:underline">
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
