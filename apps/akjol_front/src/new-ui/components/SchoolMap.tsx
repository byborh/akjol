"use client";

import { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import type { SchoolEntry } from "../data/schools";
import { getCoordsForCity } from "../data/geo";
import { findCountry } from "../data/countries";

type ClusterPoint = {
  city: string;
  countryRef: string;
  coords: [number, number];
  schools: SchoolEntry[];
  bestRating: number;
  totalPrograms: number;
  matchedPrograms: number;
};

type Props = {
  schools: SchoolEntry[];
  matchedProgramsBySchool?: Record<string, number>;
};

export default function SchoolMap({ schools, matchedProgramsBySchool = {} }: Props) {
  const clusters = useMemo<ClusterPoint[]>(() => {
    const map = new Map<string, ClusterPoint>();
    for (const s of schools) {
      const coords = getCoordsForCity(s.city);
      if (!coords) continue;
      const key = `${s.city}-${s.countryRef}`;
      const matched = matchedProgramsBySchool[s.id] ?? 0;
      const existing = map.get(key);
      if (existing) {
        existing.schools.push(s);
        existing.bestRating = Math.max(existing.bestRating, s.rating ?? 0);
        existing.totalPrograms += s.programs.length;
        existing.matchedPrograms += matched;
      } else {
        map.set(key, {
          city: s.city,
          countryRef: s.countryRef,
          coords,
          schools: [s],
          bestRating: s.rating ?? 0,
          totalPrograms: s.programs.length,
          matchedPrograms: matched,
        });
      }
    }
    return Array.from(map.values());
  }, [schools, matchedProgramsBySchool]);

  const fallbackCenter: [number, number] = clusters.length
    ? [
        clusters.reduce((sum, c) => sum + c.coords[0], 0) / clusters.length,
        clusters.reduce((sum, c) => sum + c.coords[1], 0) / clusters.length,
      ]
    : [48.8566, 2.3522];

  const allLatitudes = clusters.map((c) => c.coords[0]);
  const allLongitudes = clusters.map((c) => c.coords[1]);
  const bounds: [[number, number], [number, number]] | null = clusters.length
    ? [
        [Math.min(...allLatitudes), Math.min(...allLongitudes)],
        [Math.max(...allLatitudes), Math.max(...allLongitudes)],
      ]
    : null;

  return (
    <div className="rounded-xl overflow-hidden border border-black/5 bg-white" style={{ height: 480 }}>
      {clusters.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-[#1a1d24]/50">
          Aucune école géolocalisée pour ces filtres.
          <br />
          Coordonnées disponibles : Paris, Munich, Manchester, Saclay, Sophia Antipolis…
        </div>
      ) : (
        <MapContainer
          center={fallbackCenter}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {bounds ? <FitBounds bounds={bounds} /> : null}
          {clusters.map((c) => {
            const radius = 8 + Math.min(20, c.totalPrograms * 3);
            const color = c.matchedPrograms > 0 ? "#a3cf91" : "#ee7768";
            return (
              <CircleMarker
                key={`${c.city}-${c.countryRef}`}
                center={c.coords}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.55,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -radius]}>
                  <strong>{c.city}</strong> · {findCountry(c.countryRef)?.flag}
                  <br />
                  {c.schools.length} école{c.schools.length > 1 ? "s" : ""} · {c.totalPrograms} formation
                  {c.totalPrograms > 1 ? "s" : ""}
                  {c.matchedPrograms > 0 ? (
                    <>
                      <br />
                      <span style={{ color: "#3a6f2c" }}>
                        {c.matchedPrograms} ouvert{c.matchedPrograms > 1 ? "s" : ""} pour ton profil
                      </span>
                    </>
                  ) : null}
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: 220 }}>
                    <strong>
                      {findCountry(c.countryRef)?.flag} {c.city}
                    </strong>
                    <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
                      {c.schools.length} école{c.schools.length > 1 ? "s" : ""} · note moyenne {c.bestRating.toFixed(1)}
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {c.schools.map((s) => (
                        <li key={s.id} style={{ marginBottom: 4 }}>
                          <Link
                            href={`/new-ui/school/${s.id}`}
                            style={{ color: "#ee7768", fontWeight: 500 }}
                          >
                            {s.name}
                          </Link>
                          <span style={{ color: "rgba(0,0,0,0.5)", fontSize: 11 }}>
                            {" "}
                            · {s.programs.length} formation{s.programs.length > 1 ? "s" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}

function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
  return null;
}
