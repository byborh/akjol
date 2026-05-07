"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Clock, AlertTriangle, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { findProgram } from "../data/programs";
import { usePlanStore, nextActionFor, type PlanItem } from "../store/plan-store";

const STATUS_LABELS: Record<PlanItem["applicationStatus"], string> = {
  draft: "Brouillon",
  submitted: "Envoyée",
  under_review: "En cours d'examen",
  interview: "Convoqué·e",
  admitted: "Admis·e",
  rejected: "Refusé·e",
  withdrawn: "Retirée",
  deferred: "Reportée",
};

const STATUS_COLORS: Record<PlanItem["applicationStatus"], { bg: string; fg: string }> = {
  draft: { bg: "#1a1d2410", fg: "#1a1d2480" },
  submitted: { bg: "#a3cf9120", fg: "#3a6f2c" },
  under_review: { bg: "#e6c06820", fg: "#8a5314" },
  interview: { bg: "#ee776820", fg: "#a8463a" },
  admitted: { bg: "#a3cf9130", fg: "#3a6f2c" },
  rejected: { bg: "#d9656520", fg: "#7e2929" },
  withdrawn: { bg: "#1a1d2410", fg: "#1a1d2470" },
  deferred: { bg: "#e6c06820", fg: "#8a5314" },
};

export function PlanTimeline() {
  const items = usePlanStore((s) => s.items);
  const remove = usePlanStore((s) => s.remove);
  const toggleStep = usePlanStore((s) => s.toggleStep);
  const setApplicationStatus = usePlanStore((s) => s.setApplicationStatus);
  const addCustomStep = usePlanStore((s) => s.addCustomStep);

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#1a1d24]/60">
        Aucun programme dans ton plan. Ajoute-en depuis une fiche programme avec « Ajouter à mon plan ».
      </p>
    );
  }

  const totalSteps = items.reduce((s, i) => s + i.steps.length, 0);
  const doneSteps = items.reduce(
    (s, i) => s + i.steps.filter((x) => x.status === "done").length,
    0,
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white border border-black/5 p-3 flex flex-wrap items-center gap-3 text-[12px]">
        <span className="font-medium text-[#1a1d24]">{items.length}</span>
        <span className="text-[#1a1d24]/60">candidature{items.length > 1 ? "s" : ""}</span>
        <span className="text-[#1a1d24]/30">·</span>
        <span className="font-medium">{doneSteps}</span>
        <span className="text-[#1a1d24]/60">étape{doneSteps > 1 ? "s" : ""} accomplie{doneSteps > 1 ? "s" : ""} sur {totalSteps}</span>
      </div>

      {items.map((item) => {
        const program = findProgram(item.programId);
        if (!program) return null;
        const next = nextActionFor(item);
        const statusColor = STATUS_COLORS[item.applicationStatus];

        return (
          <div key={item.programId} className="rounded-xl bg-white border border-black/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-black/5 flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/program/${program.id}`}
                  className="font-medium text-[#1a1d24] hover:text-[#ee7768] transition truncate block"
                >
                  {program.title}
                </Link>
                <div className="text-xs text-[#1a1d24]/60">
                  {program.school.name} · {program.school.city}
                </div>
              </div>
              <select
                value={item.applicationStatus}
                onChange={(e) =>
                  setApplicationStatus(item.programId, e.target.value as PlanItem["applicationStatus"])
                }
                className="text-[12px] px-2 py-1 rounded-md border border-black/5 outline-none"
                style={{ background: statusColor.bg, color: statusColor.fg }}
              >
                {(Object.keys(STATUS_LABELS) as PlanItem["applicationStatus"][]).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_LABELS[k]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (confirm("Retirer ce programme du plan ?")) remove(item.programId);
                }}
                className="text-[#7e2929]/70 hover:bg-[#d9656510] rounded p-1.5"
                title="Retirer"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {next ? (
              <NextActionBar
                stepLabel={next.step.label}
                daysUntil={next.daysUntil}
                programId={item.programId}
              />
            ) : null}

            <ol className="px-4 py-3 space-y-2">
              {item.steps.map((step) => {
                const due = step.dueAt ? new Date(step.dueAt) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const days = due ? Math.ceil((due.getTime() - today.getTime()) / 86400000) : null;
                const isOverdue = days !== null && days < 0 && step.status !== "done";
                return (
                  <li key={step.id} className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleStep(item.programId, step.id)}
                      className="mt-0.5 shrink-0"
                      aria-label="Toggle step"
                    >
                      {step.status === "done" ? (
                        <CheckCircle2 size={16} className="text-[#3a6f2c]" />
                      ) : (
                        <Circle size={16} className="text-[#1a1d24]/30" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px]"
                        style={{
                          color: step.status === "done" ? "#1a1d2470" : "#1a1d24",
                          textDecoration: step.status === "done" ? "line-through" : "none",
                        }}
                      >
                        {step.label}
                      </div>
                      <div className="text-[11px] text-[#1a1d24]/50 mt-0.5 inline-flex items-center gap-2">
                        {due ? (
                          <>
                            <Clock size={10} />
                            {due.toLocaleDateString("fr-FR")}
                            {days !== null && step.status !== "done" ? (
                              <span
                                className={
                                  isOverdue
                                    ? "text-[#7e2929]"
                                    : days <= 7
                                      ? "text-[#a8463a]"
                                      : ""
                                }
                              >
                                · {isOverdue ? `en retard de ${Math.abs(days)}j` : `dans ${days}j`}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="italic text-[#1a1d24]/40">pas de deadline</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="px-4 pb-3">
              <AddCustomStepInline onAdd={(label) => addCustomStep(item.programId, label)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NextActionBar({
  stepLabel,
  daysUntil,
  programId,
}: {
  stepLabel: string;
  daysUntil: number | null;
  programId: string;
}) {
  if (daysUntil === null) {
    return (
      <div className="px-4 py-2 bg-[#fafaf7] text-[12px] text-[#1a1d24]/70 inline-flex items-center gap-2">
        <Clock size={12} />
        Prochaine action : <strong className="text-[#1a1d24]">{stepLabel}</strong>
      </div>
    );
  }
  const isOverdue = daysUntil < 0;
  const isUrgent = daysUntil >= 0 && daysUntil <= 7;
  return (
    <div
      className="px-4 py-2 text-[12px] inline-flex items-center gap-2 w-full"
      style={{
        background: isOverdue ? "#d9656518" : isUrgent ? "#e6c06820" : "#fafaf7",
        color: isOverdue ? "#7e2929" : isUrgent ? "#8a5314" : "#1a1d2480",
      }}
    >
      {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
      <span>
        {isOverdue
          ? `En retard de ${Math.abs(daysUntil)}j`
          : daysUntil === 0
            ? "Aujourd'hui"
            : `Dans ${daysUntil}j`}
      </span>
      <span className="text-[#1a1d24]/40">·</span>
      <strong>{stepLabel}</strong>
      <Link
        href={`/program/${programId}`}
        className="ml-auto text-[11px] hover:underline"
      >
        Voir programme →
      </Link>
    </div>
  );
}

function AddCustomStepInline({ onAdd }: { onAdd: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] text-[#1a1d24]/50 hover:text-[#ee7768]"
      >
        <Plus size={11} /> Ajouter une étape personnelle
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (label.trim()) {
          onAdd(label.trim());
          setLabel("");
          setOpen(false);
        }
      }}
      className="flex items-center gap-2"
    >
      <input
        autoFocus
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="ex : préparer le PDF du dossier"
        className="flex-1 text-[12px] rounded-md border border-black/10 px-2 py-1.5 outline-none focus:border-[#ee7768]"
      />
      <button
        type="submit"
        className="text-[12px] px-2.5 py-1.5 rounded-md bg-[#ee7768] text-white"
      >
        Ajouter
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setLabel("");
        }}
        className="text-[12px] text-[#1a1d24]/50"
      >
        Annuler
      </button>
    </form>
  );
}
