"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, GraduationCap, IdCard } from "lucide-react";
import { ParcoursMenu } from "./ParcoursMenu";

const NAV_ITEMS = [
  { href: "/explore", label: "Explorer", icon: Compass },
  { href: "/catalog", label: "Catalogue", icon: GraduationCap },
  { href: "/passport", label: "Passeport", icon: IdCard },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAF7]/85 backdrop-blur-md border-b border-black/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#1a1d24] font-semibold tracking-tight shrink-0"
        >
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#ee7768" }} />
          AkJol
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition"
                style={{
                  color: active ? "#ee7768" : "#1a1d24b3",
                  background: active ? "#ee776812" : "transparent",
                }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <ParcoursMenu />
        </nav>
      </div>
    </header>
  );
}
