import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useAuthStore } from "../store/authStore";

function navLinkClasses({ isActive }: { isActive: boolean }): string {
  return `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;
}

export function AppLayout() {
  const { t } = useTranslation("common");
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isTenantManager = roles.includes("TenantManager");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="text-xl font-semibold text-slate-900">{t("appName")}</span>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/app/items" className={navLinkClasses}>
              {t("nav.items")}
            </NavLink>
            {(isAdmin || isTenantManager) && (
              <>
                <NavLink to="/app/tenant/users" className={navLinkClasses}>
                  {t("nav.tenantUsers")}
                </NavLink>
                <NavLink to="/app/tenant/users/new" className={navLinkClasses}>
                  {t("nav.createTenantUser")}
                </NavLink>
              </>
            )}
            {isAdmin && (
              <>
                <NavLink to="/app/admin/users" className={navLinkClasses}>
                  {t("nav.adminUsers")}
                </NavLink>
                <NavLink to="/app/admin/tenants" className={navLinkClasses}>
                  {t("nav.adminTenants")}
                </NavLink>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/app/account/profile" className={navLinkClasses}>
            {t("nav.profile")}
          </NavLink>
          <NavLink to="/app/account/api-keys" className={navLinkClasses}>
            {t("nav.apiKeys")}
          </NavLink>
          <LanguageSwitcher />
          <span className="text-sm text-slate-600">{user?.email}</span>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {t("actions.logout")}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
