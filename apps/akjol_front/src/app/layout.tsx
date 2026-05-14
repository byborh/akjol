import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AppNav } from "../components/AppNav";
import { AppFooter } from "../components/AppFooter";
import { PassportFloat } from "../components/PassportFloat";
import { CompareDrawer } from "../components/CompareDrawer";
import { RehydrateStores } from "../components/RehydrateStores";
import { IntlProvider } from "../components/IntlProvider";
import { QueryProvider } from "../components/QueryProvider";
import { PlausibleScript } from "../components/PlausibleScript";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "../i18n/config";
import { getMessagesFor } from "../i18n/getMessages";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "AkJol — De ton diplôme à tes possibles, partout.",
  description:
    "AkJol est un routeur d'études : tu décris ton point de départ, on te montre toutes tes possibilités d'études, partout dans le monde, avec leurs conditions explicites.",
  manifest: "/manifest.webmanifest",
  applicationName: "AkJol",
  appleWebApp: {
    capable: true,
    title: "AkJol",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <IntlProvider locale={locale} messages={messages}>
          <QueryProvider>
            <RehydrateStores />
            <AppNav />
            <main id="main-content" tabIndex={-1} className="pb-12">
              {children}
            </main>
            <AppFooter />
            <PassportFloat />
            <CompareDrawer />
          </QueryProvider>
        </IntlProvider>
        <PlausibleScript />
      </body>
    </html>
  );
}
