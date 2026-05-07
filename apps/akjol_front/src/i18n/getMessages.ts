import fr from "../messages/fr.json";
import en from "../messages/en.json";
import { DEFAULT_LOCALE, type Locale } from "./config";

const ALL: Record<Locale, Record<string, unknown>> = { fr, en };

export function getMessagesFor(locale: Locale | undefined): Record<string, unknown> {
  return ALL[locale ?? DEFAULT_LOCALE];
}
