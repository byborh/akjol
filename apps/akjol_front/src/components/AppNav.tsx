"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Briefcase, Compass, GraduationCap, IdCard, User } from "lucide-react";
import { ParcoursMenu } from "./ParcoursMenu";
import { useAuthStore } from "../store/auth-store";

const NAV_ITEMS = [
  { href: "/explore", labelKey: "explore" as const, icon: Compass },
  { href: "/catalog", labelKey: "catalog" as const, icon: GraduationCap },
  { href: "/jobs", labelKey: "jobs" as const, icon: Briefcase },
  { href: "/passport", labelKey: "passport" as const, icon: IdCard },
];

export function AppNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refresh);
  const fetched = useAuthStore((s) => s.fetched);

  useEffect(() => {
    if (!fetched) void refresh();
  }, [fetched, refresh]);
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
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
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
                <span className="hidden sm:inline">{t(labelKey)}</span>
              </Link>
            );
          })}
          <ParcoursMenu />
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition text-sm"
            style={{
              color: pathname.startsWith("/account") ? "#ee7768" : "#1a1d24b3",
              background: pathname.startsWith("/account") ? "#ee776812" : "transparent",
            }}
            title={user ? user.email : t("login")}
          >
            <User size={14} />
            <span className="hidden sm:inline">{user ? user.name : t("account")}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
