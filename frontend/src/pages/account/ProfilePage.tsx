import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../store/authStore";

export function ProfilePage() {
  const { t } = useTranslation("account");
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <h1 className="text-2xl font-semibold text-slate-900">{t("profile.title")}</h1>

      <section className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("profile.emailLabel")}
        </h2>
        <p className="text-slate-900">{user.email}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("profile.rolesLabel")}
        </h2>
        {user.roles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
              >
                {role}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">{t("profile.noRoles")}</p>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("profile.tenantLabel")}
        </h2>
        <p className="text-slate-900">{user.tenantId ?? t("profile.noTenant")}</p>
      </section>
    </div>
  );
}
