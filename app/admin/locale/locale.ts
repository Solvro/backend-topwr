import { CurrentAdmin, Locale, LocaleTranslations } from "adminjs";

import enLocale from "./en/translation.json" with { type: "json" };
import plLocale from "./pl/translation.json" with { type: "json" };

export const locale:
  | Locale
  | ((admin?: CurrentAdmin) => Locale | Promise<Locale>) = {
  language: "pl",
  availableLanguages: ["pl", "en"],
  translations: {
    pl: plLocale as LocaleTranslations,
    en: enLocale as LocaleTranslations,
  },
};
