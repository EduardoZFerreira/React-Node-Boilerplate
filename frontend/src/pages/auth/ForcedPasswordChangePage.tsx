import { useTranslation } from "react-i18next";

import { ChangePasswordForm } from "../../components/ChangePasswordForm";
import { useAuthStore } from "../../store/authStore";

// Rendered in place of the whole app (see App.tsx) whenever the authenticated
// user's mustResetPassword flag is set — the backend enforces the same block
// on every other endpoint (see blockIfMustResetPassword), this is just the UI
// side of it.
export function ForcedPasswordChangePage() {
  const { t } = useTranslation("auth");
  const clearMustResetPassword = useAuthStore((state) => state.clearMustResetPassword);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t("changePassword.forcedTitle")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("changePassword.forcedNotice")}</p>
        </div>
        <ChangePasswordForm onSuccess={clearMustResetPassword} />
      </div>
    </div>
  );
}
