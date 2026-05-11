"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import { COUNTRIES, findCountry } from "../data/countries";
import { usePrograms } from "../hooks/data";
import { numericToAlpha2 } from "../data/isoNumeric";
import { statsByCountry, colorForStatus, type CountryStats } from "../engine/countryFeasibility";
import { usePassportStore } from "../store/passport-store";
import { applyTrajectory, useTrajectoryStore } from "../store/trajectory-store";
import { useEquivalencesStore } from "../store/equivalences-store";
import { useRouter } from "next/navigation";

const ReactGlobe = dynamic(() => import("react-globe.gl"), { ssr: false });

type CountryFeature = Feature<Geometry, { name?: string }> & { id?: string | number };

const TOPO_URL = "https://unpkg.com/world-atlas@2/countries-110m.json";

export function Globe({ height = 560 }: { height?: number }) {
  const router = useRouter();
  const globeRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const [stoppedRotate, setStoppedRotate] = useState(false);

  const passport = usePassportStore((s) => s.passport);
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const equivEdges = useEquivalencesStore((s) => s.edges);
  const { data: programs = [] } = usePrograms();
  const effective = useMemo(
    () => applyTrajectory(passport, { fromOverride, steps }),
    [passport, fromOverride, steps],
  );

  const stats = useMemo(
    () => statsByCountry(effective, programs, equivEdges),
    [effective, programs, equivEdges],
  );

  useEffect(() => {
    let cancelled = false;
    fetch(TOPO_URL)
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const coll = topo.objects.countries as GeometryCollection;
        const fc = feature(topo, coll) as unknown as { features: CountryFeature[] };
        setFeatures(fc.features);
      })
      .catch(() => {
        /* network unavailable: fallback handled by empty features */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const g = globeRef.current as
      | { controls: () => { autoRotate: boolean; autoRotateSpeed: number }; pointOfView: (v: { lat: number; lng: number; altitude: number }, ms?: number) => void }
      | null;
    if (!g) return;
    const c = g.controls();
    c.autoRotate = !stoppedRotate;
    c.autoRotateSpeed = 0.35;
  }, [stoppedRotate, features.length]);

  function statsFor(f: CountryFeature): { iso2?: string; stats?: CountryStats } {
    const iso2 = numericToAlpha2(f.id ?? "");
    if (!iso2) return {};
    return { iso2, stats: stats.get(iso2) };
  }

  function colorFor(f: object): string {
    const { stats: cs } = statsFor(f as CountryFeature);
    if (!cs) return colorForStatus("uncovered");
    return colorForStatus(cs.best);
  }

  function sideColorFor(f: object): string {
    const c = colorFor(f);
    return c + "aa";
  }

  function altFor(f: object): number {
    const { stats: cs } = statsFor(f as CountryFeature);
    if (!cs) return 0.005;
    if (cs.best === "open") return 0.035;
    if (cs.best === "open_with_step") return 0.022;
    if (cs.best === "closed") return 0.012;
    return 0.005;
  }

  function onHover(f: object | null) {
    setHovered((f as CountryFeature) ?? null);
    if (f && !stoppedRotate) setStoppedRotate(true);
  }

  function onClick(f: object) {
    const { iso2 } = statsFor(f as CountryFeature);
    if (!iso2) return;
    const known = COUNTRIES.some((c) => c.code === iso2);
    if (!known) return;
    router.push(`/explore/${iso2.toLowerCase()}`);
  }

  const tooltipNode = hovered ? renderTooltip(hovered, statsFor(hovered).iso2, statsFor(hovered).stats) : null;

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden bg-[#0c1220] border border-black/5"
      style={{ height }}
    >
      {features.length > 0 ? (
        <ReactGlobe
          ref={globeRef as never}
          width={width}
          height={height}
          backgroundColor="#0c1220"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="#ee7768"
          atmosphereAltitude={0.15}
          polygonsData={features}
          polygonAltitude={altFor}
          polygonCapColor={colorFor}
          polygonSideColor={sideColorFor}
          polygonStrokeColor={() => "rgba(255,255,255,0.18)"}
          polygonLabel={() => ""}
          onPolygonHover={onHover}
          onPolygonClick={onClick}
          polygonsTransitionDuration={400}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
          Chargement du globe…
        </div>
      )}
      <Legend />
      {tooltipNode ? <FixedTooltip>{tooltipNode}</FixedTooltip> : null}
    </div>
  );
}

function renderTooltip(f: CountryFeature, iso2: string | undefined, cs: CountryStats | undefined) {
  const known = iso2 ? findCountry(iso2) : undefined;
  const name = known?.name ?? f.properties?.name ?? "—";
  const flag = known?.flag ?? "🌍";
  if (!cs) {
    return (
      <div className="space-y-0.5">
        <div className="font-medium">{flag} {name}</div>
        <div className="text-white/60 text-[11px]">Pas couvert pour l'instant.</div>
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      <div className="font-medium">{flag} {name}</div>
      <div className="text-[11px] text-white/80">
        <span className="text-[#a3cf91]">{cs.open}</span> ouverts ·{" "}
        <span className="text-[#e6c068]">{cs.amber}</span> avec étape ·{" "}
        <span className="text-[#c98a8a]">{cs.closed}</span> fermés
      </div>
      <div className="text-[10px] text-white/50 mt-1">Clique pour explorer →</div>
    </div>
  );
}

function FixedTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute top-3 left-3 max-w-[260px] rounded-lg bg-black/70 backdrop-blur px-3 py-2 text-white text-xs shadow-lg">
      {children}
    </div>
  );
}

function Legend() {
  const items: { label: string; color: string }[] = [
    { label: "Ouvert", color: colorForStatus("open") },
    { label: "Avec étape", color: colorForStatus("open_with_step") },
    { label: "Fermé", color: colorForStatus("closed") },
    { label: "Non couvert", color: colorForStatus("uncovered") },
  ];
  return (
    <div className="absolute bottom-3 left-3 rounded-lg bg-black/55 backdrop-blur px-3 py-2 text-[11px] text-white/85 space-y-1">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: i.color }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}
