/**
 * Taux de change fixes pour MVP — branchement API ECB prévu en V2.
 *
 * Sert à afficher les coûts (coût/an, loyer, frais d'inscription) dans la
 * devise locale de l'utilisateur (£ pour locale en, € pour fr).
 *
 * Convention : tous les coûts en fixtures sont stockés en EUR. La conversion
 * a lieu uniquement à l'affichage via `formatCost(locale, eurAmount)`.
 */

import type { Locale } from "../i18n/config";

export type Currency = "EUR" | "GBP" | "USD";

export const FX_RATES_EUR: Record<Currency, number> = {
  EUR: 1,
  GBP: 0.85,
  USD: 1.07,
};

export const FX_DATE = "2026-05-01";
export const FX_SOURCE_LABEL = "Taux fixe MVP — ECB visé V2";

export function currencyForLocale(locale: Locale): Currency {
  return locale === "en" ? "GBP" : "EUR";
}

export function convertFromEur(amountEur: number, target: Currency): number {
  return amountEur * FX_RATES_EUR[target];
}

export function formatCost(
  locale: Locale,
  amountEur: number,
  opts: { suffix?: string; round?: boolean } = {},
): string {
  const currency = currencyForLocale(locale);
  const converted = convertFromEur(amountEur, currency);
  const value = opts.round !== false ? Math.round(converted) : converted;
  const formatter = new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(value) + (opts.suffix ?? "");
}

export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(localeTag(locale)).format(n);
}

export function formatDate(locale: Locale, iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

function localeTag(locale: Locale): string {
  return locale === "en" ? "en-GB" : "fr-FR";
}
