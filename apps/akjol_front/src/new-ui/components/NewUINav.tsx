"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function NewUINav() {
  const pathname = usePathname();
  const isLanding = pathname === "/new-ui";
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAF7]/85 backdrop-blur-md border-b border-black/5">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/new-ui" className="flex items-center gap-2 text-[#1a1d24] font-semibold tracking-tight">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: "#ee7768" }}
          />
          AkJol
          <span className="text-[10px] uppercase tracking-wider text-[#1a1d24]/40 font-medium ml-1">
            new ui
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {!isLanding ? (
            <Link href="/new-ui/explore" className="text-[#1a1d24]/70 hover:text-[#ee7768] transition">
              Explorer
            </Link>
          ) : null}
          <Link href="/new-ui/passport" className="text-[#1a1d24]/70 hover:text-[#ee7768] transition">
            Mon passeport
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[#1a1d24]/40 hover:text-[#1a1d24]/80 transition text-[12px]"
          >
            <ArrowLeft size={12} /> Ancienne UI
          </Link>
        </nav>
      </div>
    </header>
  );
}
