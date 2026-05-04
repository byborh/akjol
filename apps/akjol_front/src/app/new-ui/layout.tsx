import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NewUINav } from "../../new-ui/components/NewUINav";
import { PassportFloat } from "../../new-ui/components/PassportFloat";
import { CompareDrawer } from "../../new-ui/components/CompareDrawer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "AkJol — Nouvelle UI",
  description: "Routeur d'études mondial. Phase 0 — preview.",
};

export default function NewUILayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} ${mono.variable} min-h-screen`}
      style={{
        background: "#FAFAF7",
        color: "#1a1d24",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      <NewUINav />
      <main className="pb-32">{children}</main>
      <PassportFloat />
      <CompareDrawer />
    </div>
  );
}
