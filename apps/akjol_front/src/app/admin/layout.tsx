"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="bg-[#1a1d24] text-white/90 text-[12px] px-4 py-2 flex items-center gap-2">
        <ShieldAlert size={14} className="text-[#ee7768]" />
        <span>
          Console <strong>curator</strong> — réservée. Modifications enregistrées localement.
        </span>
        <Link href="/explore" className="ml-auto text-white/60 hover:text-white">
          ← Retour app
        </Link>
      </div>
      {children}
    </div>
  );
}
