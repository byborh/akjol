"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, GitBranch, FileText, Table, Briefcase, Building2, LayoutDashboard } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof FileText;
  /** Sous-paths qui ne doivent PAS activer cette entrée (ex: /programs/batch ne doit pas activer Programs). */
  excludePrefixes?: string[];
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, excludePrefixes: ["/admin/"] },
  { href: "/admin/programs", label: "Programs", icon: FileText, excludePrefixes: ["/admin/programs/batch"] },
  { href: "/admin/programs/batch", label: "Batch", icon: Table },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/schools", label: "Schools", icon: Building2 },
  { href: "/admin/graph", label: "Equivalences", icon: GitBranch },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="bg-[#1a1d24] text-white/90 text-[12px] px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-[#ee7768]" />
          <span>
            Console <strong>curator</strong>
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, excludePrefixes }) => {
            const active =
              pathname?.startsWith(href) &&
              !excludePrefixes?.some((ex) => pathname?.startsWith(ex));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link href="/explore" className="ml-auto text-white/60 hover:text-white">
          ← Retour app
        </Link>
      </div>
      {children}
    </div>
  );
}
