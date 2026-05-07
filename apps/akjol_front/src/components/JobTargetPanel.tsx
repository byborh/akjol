"use client";

import { useMemo, useState } from "react";
import { Target, ArrowRight, Coins, Clock, MapPin } from "lucide-react";
import { JOBS, searchJobs } from "../data/jobs";
import { reverseRoutes, type Trajectory } from "../engine/reverseRoutes";
import { usePassportStore } from "../store/passport-store";
import { useTrajectoryStore, applyTrajectory } from "../store/trajectory-store";
import { findCountry } from "../data/countries";

export function JobTargetPanel() {
  const passport = usePassportStore((s) => s.passport);
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const pushStep = useTrajectoryStore((s) => s.pushStepFromProgramId);
  const resetTrajectory = useTrajectoryStore((s) => s.resetTrajectory);

  const effective = useMemo(
    () => applyTrajectory(passport, { fromOverride, steps }),
    [passport, fromOverride, steps],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const results = useMemo(() => searchJobs(query).slice(0, 8), [query]);
  const trajectories = useMemo(
    () => (selected ? reverseRoutes(effective, selected) : []),
    [selected, effective],
  );

  const job = JOBS.find((j) => j.id === selected);

  function loadTrajectory(t: Trajectory) {
    resetTrajectory();
    for (const step of t.steps) {
      pushStep(step.programId);
    }
    requestAnimationFrame(() => {
      document.querySelector("main")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <div className="rounded-xl bg-white border border-black/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="inline-flex items-center gap-2">
          <Target size={15} className="text-[#ee7768]" />
          <span className="font-medium text-[#1a1d24]">Je sais où je veux arriver</span>
          {job ? (
            <span className="text-[12px] text-[#ee7768] font-medium">→ {job.label}</span>
          ) : (
            <span className="text-[12px] text-[#1a1d24]/50">choisis un métier-cible</span>
          )}
        </span>
        <span className="text-[11px] text-[#1a1d24]/50">
          {open ? "Replier" : "Déplier"}
        </span>
      </button>

      {open ? (
        <div className="px-4 pb-4 space-y-3 border-t border-black/5">
          <div className="pt-3">
            <input
              type="text"
              placeholder="Cherche un métier… (ex: Médecin, DevOps, UX)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm rounded-md border border-black/10 px-3 py-2 outline-none focus:border-[#ee7768]"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {results.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelected(j.id)}
                  className="text-[12px] px-2.5 py-1 rounded-full transition"
                  style={{
                    background: selected === j.id ? "#ee776820" : "#fafaf7",
                    color: selected === j.id ? "#a8463a" : "#1a1d24cc",
                    border: "1px solid " + (selected === j.id ? "#ee776840" : "transparent"),
                  }}
                >
                  {j.label}
                </button>
              ))}
            </div>
          </div>

          {selected && job ? (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Routes vers {job.label}
                <span className="ml-2 text-[11px] text-[#1a1d24]/50 font-normal">
                  depuis ton passeport actuel
                </span>
              </h3>
              {trajectories.length === 0 ? (
                <p className="text-[12px] text-[#1a1d24]/60">
                  Aucune route trouvée dans la profondeur 5 étapes. Essaie un autre métier ou
                  enrichis ton passeport.
                </p>
              ) : (
                <div className="space-y-2">
                  {trajectories.map((t, idx) => (
                    <TrajectoryCard
                      key={idx}
                      trajectory={t}
                      onLoad={() => loadTrajectory(t)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TrajectoryCard({ trajectory, onLoad }: { trajectory: Trajectory; onLoad: () => void }) {
  const flags = trajectory.countries
    .map((c) => findCountry(c)?.flag ?? "")
    .filter(Boolean)
    .join(" ");
  return (
    <div className="rounded-lg border border-black/5 bg-[#fafaf7] p-3">
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-[#1a1d24]/60 mb-0.5">
            {flags} {trajectory.steps.length} étape{trajectory.steps.length > 1 ? "s" : ""}
          </div>
          <div className="text-sm font-medium leading-snug">
            {trajectory.steps.map((s) => s.title).join(" → ")}
          </div>
          <p className="text-[11px] text-[#1a1d24]/60 mt-1">{trajectory.rationale}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-md bg-white border border-black/5 px-2 py-1">
          <div className="text-[10px] text-[#1a1d24]/50 inline-flex items-center gap-1">
            <Clock size={10} /> Durée
          </div>
          <div className="font-medium">{trajectory.totalYears} an{trajectory.totalYears > 1 ? "s" : ""}</div>
        </div>
        <div className="rounded-md bg-white border border-black/5 px-2 py-1">
          <div className="text-[10px] text-[#1a1d24]/50 inline-flex items-center gap-1">
            <Coins size={10} /> Coût
          </div>
          <div className="font-medium font-mono">
            {trajectory.totalCost === 0
              ? "Gratuit"
              : `${trajectory.totalCost.toLocaleString("fr-FR")} €`}
          </div>
        </div>
        <div className="rounded-md bg-white border border-black/5 px-2 py-1">
          <div className="text-[10px] text-[#1a1d24]/50 inline-flex items-center gap-1">
            <MapPin size={10} /> Probabilité
          </div>
          <div className="font-medium">
            {Math.round(trajectory.joinedProbability * 100)}%
          </div>
        </div>
      </div>
      <button
        onClick={onLoad}
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#ee776812] text-[#a8463a] hover:bg-[#ee776822]"
      >
        Charger cette trajectoire <ArrowRight size={11} />
      </button>
    </div>
  );
}
