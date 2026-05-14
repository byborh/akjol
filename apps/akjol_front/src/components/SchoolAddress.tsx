"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { SchoolEntry } from "../data/schools";
import { getCoordsForCity } from "../data/geo";

const SchoolMapInline = dynamic(() => import("./SchoolMapInline"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-black/5 bg-[#fafaf7] h-[220px]" />
  ),
});

type Props = {
  school: SchoolEntry;
};

export function SchoolAddress({ school }: Props) {
  const t = useTranslations("school");
  const hasAddress = Boolean(school.address);
  const fullAddress = [school.address, school.postalCode, school.city]
    .filter(Boolean)
    .join(", ");
  const mapsQuery = encodeURIComponent(
    hasAddress ? `${school.name}, ${fullAddress}` : `${school.name}, ${school.city}`,
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const hasCoords =
    (school.lat != null && school.lng != null) || getCoordsForCity(school.city) != null;

  return (
    <section className="rounded-2xl bg-white border border-black/5 p-5 mb-6">
      <h2 className="text-base font-medium text-[#1a1d24] mb-3 inline-flex items-center gap-2">
        <MapPin size={16} className="text-[#ee7768]" /> {t("addressTitle")}
      </h2>

      {hasCoords ? (
        <div className="mb-4">
          <SchoolMapInline school={school} />
        </div>
      ) : null}

      <dl className="space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-[#1a1d24]/50 w-24 shrink-0">{t("addressLine")}</dt>
          <dd className="text-[#1a1d24]">
            {hasAddress ? (
              fullAddress
            ) : (
              <span className="text-[#1a1d24]/50 italic">
                {t("addressUnknown")}
                {school.websiteUrl ? (
                  <>
                    {" "}·{" "}
                    <a
                      href={school.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#ee7768] hover:underline"
                    >
                      {t("website")} <ExternalLink size={11} className="inline" />
                    </a>
                  </>
                ) : null}
              </span>
            )}
          </dd>
        </div>

        {school.phone ? (
          <div className="flex gap-2">
            <dt className="text-[#1a1d24]/50 w-24 shrink-0 inline-flex items-center gap-1">
              <Phone size={12} /> {t("phone")}
            </dt>
            <dd>
              <a
                href={`tel:${school.phone.replace(/\s+/g, "")}`}
                className="text-[#1a1d24] hover:text-[#ee7768] hover:underline"
              >
                {school.phone}
              </a>
            </dd>
          </div>
        ) : null}

        {school.email ? (
          <div className="flex gap-2">
            <dt className="text-[#1a1d24]/50 w-24 shrink-0 inline-flex items-center gap-1">
              <Mail size={12} /> {t("email")}
            </dt>
            <dd>
              <a
                href={`mailto:${school.email}`}
                className="text-[#1a1d24] hover:text-[#ee7768] hover:underline"
              >
                {school.email}
              </a>
            </dd>
          </div>
        ) : null}

        {school.websiteUrl && hasAddress ? (
          <div className="flex gap-2">
            <dt className="text-[#1a1d24]/50 w-24 shrink-0 inline-flex items-center gap-1">
              <ExternalLink size={12} /> {t("website")}
            </dt>
            <dd>
              <a
                href={school.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#ee7768] hover:underline break-all"
              >
                {school.websiteUrl.replace(/^https?:\/\//, "")}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm text-[#1a1d24] hover:border-[#ee7768] transition"
        >
          <MapPin size={14} /> {t("viewOnMaps")}
        </a>
      </div>
    </section>
  );
}
