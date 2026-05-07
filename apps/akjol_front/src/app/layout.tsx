import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AppNav } from "../components/AppNav";
import { AppFooter } from "../components/AppFooter";
import { PassportFloat } from "../components/PassportFloat";
import { CompareDrawer } from "../components/CompareDrawer";
import { RehydrateStores } from "../components/RehydrateStores";
import { IntlProvider } from "../components/IntlProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "../i18n/config";
import { getMessagesFor } from "../i18n/getMessages";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "AkJol — Routeur d'études",
  description: "Dis-moi où tu en es, je te montre toutes les vies possibles.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const cookieLocale = c.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const messages = getMessagesFor(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${mono.variable}`}>
      <body
        className="min-h-screen antialiased"
        style={{
          background: "#FAFAF7",
          color: "#1a1d24",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        <IntlProvider locale={locale} messages={messages}>
          <RehydrateStores />
          <AppNav />
          <main className="pb-12">{children}</main>
          <AppFooter />
          <PassportFloat />
          <CompareDrawer />
        </IntlProvider>
      </body>
    </html>
  );
}
