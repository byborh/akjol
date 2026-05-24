"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function AppFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-black/5 mt-16 py-6 px-4 sm:px-5">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#1a1d24]/60">
        <span>
          AkJol — {t("tagline")} · <span className="text-[#1a1d24]/40">v1.5</span>
        </span>
        <nav aria-label={t("secondary")} className="flex items-center gap-x-4 gap-y-1 flex-wrap">
          <Link href="/methodologie" className="hover:text-[#1a1d24]">
            {t("methodology")}
          </Link>
          <Link href="/bourses" className="hover:text-[#1a1d24]">
            {t("scholarships")}
          </Link>
          <Link href="/account" className="hover:text-[#1a1d24]">
            {t("account")}
          </Link>
          <Link href="/privacy" className="hover:text-[#1a1d24]">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-[#1a1d24]">
            {t("terms")}
          </Link>
          <Link href="/data" className="hover:text-[#1a1d24]">
            {t("data")}
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1a1d24]"
          >
            {t("github")}
          </a>
          <LocaleSwitcher />
        </nav>
      </div>
    </footer>
  );
}
