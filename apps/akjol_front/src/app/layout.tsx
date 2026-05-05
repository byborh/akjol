import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NewUINav } from "../new-ui/components/NewUINav";
import { PassportFloat } from "../new-ui/components/PassportFloat";
import { CompareDrawer } from "../new-ui/components/CompareDrawer";
import { RehydrateStores } from "../new-ui/components/RehydrateStores";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "AkJol — Routeur d'études",
  description: "Dis-moi où tu en es, je te montre toutes les vies possibles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${mono.variable}`}>
      <body
        className="min-h-screen antialiased"
        style={{
          background: "#FAFAF7",
          color: "#1a1d24",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        <RehydrateStores />
        <NewUINav />
        <main className="pb-32">{children}</main>
        <PassportFloat />
        <CompareDrawer />
      </body>
    </html>
  );
}
