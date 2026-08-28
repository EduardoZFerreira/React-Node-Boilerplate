import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">404</h1>
      <p className="text-slate-600">{t("errors.notFound")}</p>
      <Link to="/" className="text-sm font-medium text-slate-900 hover:underline">
        {t("backHome")}
      </Link>
    </div>
  );
}
