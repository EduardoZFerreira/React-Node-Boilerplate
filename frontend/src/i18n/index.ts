import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import commonEn from "./locales/en/common.json";
import commonPtBR from "./locales/pt-BR/common.json";
import authEn from "./locales/en/auth.json";
import authPtBR from "./locales/pt-BR/auth.json";
import landingEn from "./locales/en/landing.json";
import landingPtBR from "./locales/pt-BR/landing.json";
import itemsEn from "./locales/en/items.json";
import itemsPtBR from "./locales/pt-BR/items.json";
import adminEn from "./locales/en/admin.json";
import adminPtBR from "./locales/pt-BR/admin.json";
import tenantEn from "./locales/en/tenant.json";
import tenantPtBR from "./locales/pt-BR/tenant.json";

export const SUPPORTED_LANGUAGES = ["en", "pt-BR"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "language";

function getStoredLanguage(): SupportedLanguage | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)
      ? (stored as SupportedLanguage)
      : null;
  } catch {
    return null;
  }
}

function detectBrowserLanguage(): SupportedLanguage {
  const browserLanguage = navigator.language;
  return SUPPORTED_LANGUAGES.find((lang) => browserLanguage.startsWith(lang.split("-")[0])) ?? "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { common: commonEn, auth: authEn, landing: landingEn, items: itemsEn, admin: adminEn, tenant: tenantEn },
    "pt-BR": {
      common: commonPtBR,
      auth: authPtBR,
      landing: landingPtBR,
      items: itemsPtBR,
      admin: adminPtBR,
      tenant: tenantPtBR,
    },
  },
  lng: getStoredLanguage() ?? detectBrowserLanguage(),
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "auth", "landing", "items", "admin", "tenant"],
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (language) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // localStorage unavailable (e.g. private browsing) — language just won't persist across reloads
  }
});

export default i18n;
