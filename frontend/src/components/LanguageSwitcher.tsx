import { useTranslation } from "react-i18next";

import { SUPPORTED_LANGUAGES } from "../i18n";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "EN",
  "pt-BR": "PT",
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-md border border-slate-200 p-0.5 text-sm font-medium">
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => i18n.changeLanguage(language)}
          aria-pressed={i18n.resolvedLanguage === language}
          className={`rounded px-2 py-1 transition-colors ${
            i18n.resolvedLanguage === language
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {LANGUAGE_LABELS[language] ?? language}
        </button>
      ))}
    </div>
  );
}
