export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "akjol_locale";

export function isLocale(s: string | undefined): s is Locale {
  return s === "fr" || s === "en";
}
