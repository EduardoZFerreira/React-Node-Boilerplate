import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/ui/TableSkeleton";
import { useDeleteItemMutation, useItemsQuery } from "../../queries/items";
import { useAuthStore } from "../../store/authStore";
import type { Item } from "../../types/item";

const PAGE_SIZE = 10;

export function ItemsListPage() {
  const { t } = useTranslation("items");
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const { data, isLoading, isError } = useItemsQuery(page, PAGE_SIZE);
  const deleteMutation = useDeleteItemMutation();

  function canManage(item: Item): boolean {
    return item.createdById === user?.id || Boolean(user?.roles.includes("Admin"));
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    await deleteMutation.mutateAsync(itemToDelete.id);
    setItemToDelete(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("pageTitle")}</h1>
        <Link to="/app/items/new">
          <Button type="button">{t("createButton")}</Button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton columns={4} />
      ) : isError ? (
        <p className="text-red-600">{t("common:errors.generic")}</p>
      ) : data && data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">{t("columns.title")}</th>
                <th className="px-4 py-3 font-medium">{t("columns.description")}</th>
                <th className="px-4 py-3 font-medium">{t("columns.status")}</th>
                <th className="px-4 py-3 font-medium">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600">{item.description || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        item.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.isActive ? t("status.active") : t("status.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage(item) ? (
                      <div className="flex gap-3">
                        <Link to={`/app/items/${item.id}/edit`} className="text-slate-700 hover:underline">
                          {t("common:actions.edit")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="text-red-600 hover:underline"
                        >
                          {t("common:actions.delete")}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500">{t("empty")}</p>
      )}

      {data ? <Pagination page={data.page} pages={data.pages} onPageChange={setPage} /> : null}

      <ConfirmDialog
        open={Boolean(itemToDelete)}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
}
