"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import type { Locale } from "../i18n/config";

type Props = {
  locale: Locale;
  messages: Record<string, unknown>;
  children: ReactNode;
};

export function IntlProvider({ locale, messages, children }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Paris">
      {children}
    </NextIntlClientProvider>
  );
}
