"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LivesMenu } from "./LivesMenu";

export function AppNav() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAF7]/85 backdrop-blur-md border-b border-black/5">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-[#1a1d24] font-semibold tracking-tight shrink-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: "#ee7768" }}
          />
          AkJol
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4 text-sm">
          {!isLanding ? (
            <Link href="/explore" className="text-[#1a1d24]/70 hover:text-[#ee7768] transition hidden sm:inline">
              Explorer
            </Link>
          ) : null}
          <Link href="/catalog" className="text-[#1a1d24]/70 hover:text-[#ee7768] transition hidden sm:inline">
            Catalogue
          </Link>
          <Link href="/passport" className="text-[#1a1d24]/70 hover:text-[#ee7768] transition hidden sm:inline">
            Passeport
          </Link>
          <LivesMenu />
        </nav>
      </div>
    </header>
  );
}
