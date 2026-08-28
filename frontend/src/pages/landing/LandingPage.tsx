import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface LandingSection {
  title: string;
  body: string;
}

export function LandingPage() {
  const { t } = useTranslation("landing");
  const sections = t("sections", { returnObjects: true }) as LandingSection[];

  return (
    <div>
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-24 text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {t("hero.eyebrow")}
        </span>
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">{t("hero.title")}</h1>
        <p className="max-w-2xl text-lg text-slate-600">{t("hero.subtitle")}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {t("hero.primaryCta")}
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {t("hero.secondaryCta")}
          </Link>
        </div>
      </section>

      {sections.map((section, index) => (
        <section
          key={section.title}
          className={index % 2 === 1 ? "bg-slate-50 px-6 py-20" : "bg-white px-6 py-20"}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-4 text-slate-600">{section.body}</p>
          </div>
        </section>
      ))}

      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
        {t("footer")}
      </footer>
    </div>
  );
}
