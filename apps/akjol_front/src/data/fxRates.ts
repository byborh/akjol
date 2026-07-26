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

export type Currency = "EUR" | "GBP" | "USD" | "CNY" | "JPY" | "CAD" | "AUD" | "CHF";

// Unités de devise pour 1 EUR (1 EUR = X). Sert à afficher des coûts stockés
// dans n'importe quelle devise (ex. frais en CNY) dans la devise de l'utilisateur.
export const FX_RATES_EUR: Record<Currency, number> = {
  EUR: 1,
  GBP: 0.85,
  USD: 1.07,
  CNY: 7.8,
  JPY: 165,
  CAD: 1.47,
  AUD: 1.63,
  CHF: 0.94,
};

export const FX_DATE = "2026-05-01";
export const FX_SOURCE_LABEL = "Taux fixe MVP — ECB visé V2";

export function currencyForLocale(locale: Locale): Currency {
  return locale === "en" ? "GBP" : "EUR";
}

export function convertFromEur(amountEur: number, target: Currency): number {
  return amountEur * FX_RATES_EUR[target];
}

/** Convertit un montant d'une devise source vers EUR (inverse de convertFromEur). */
export function convertToEur(amount: number, source: Currency): number {
  return amount / FX_RATES_EUR[source];
}

export function formatCost(
  locale: Locale,
  amount: number,
  opts: { suffix?: string; round?: boolean; fromCurrency?: string } = {},
): string {
  // `amount` est en EUR par défaut ; si `fromCurrency` est fourni (ex. "CNY"),
  // on normalise d'abord vers EUR. Devise inconnue → traitée comme EUR.
  const rate = opts.fromCurrency ? FX_RATES_EUR[opts.fromCurrency as Currency] : undefined;
  const amountEur = rate ? amount / rate : amount;
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
