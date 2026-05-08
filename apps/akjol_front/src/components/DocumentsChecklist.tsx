"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, FileText, Layers, Mail, Send, CheckCircle2, Clock } from "lucide-react";
import { findProgram } from "../data/programs";
import { usePlanStore } from "../store/plan-store";
import { usePassportStore } from "../store/passport-store";
import {
  useDocumentsStore,
  type DocStatus,
  EXPIRY_WARNING_DAYS,
  expiryDaysLeft,
} from "../store/documents-store";

const STATUS_LABEL: Record<DocStatus, string> = {
  todo: "À faire",
  requested: "Demandé",
  received: "Reçu",
  sent: "Envoyé",
  expired: "Expiré",
};

const STATUS_COLOR: Record<DocStatus, string> = {
  todo: "#1a1d24",
  requested: "#8a5314",
  received: "#3a6f2c",
  sent: "#3a6f2c",
  expired: "#7e2929",
};

const STATUS_BG: Record<DocStatus, string> = {
  todo: "#1a1d2410",
  requested: "#fcf6e8",
  received: "#a3cf9120",
  sent: "#a3cf9130",
  expired: "#d9656520",
};

const STATUS_ORDER: DocStatus[] = ["todo", "requested", "received", "sent", "expired"];

/**
 * Pour chaque programme du plan + des programmes sauvegardés du passeport,
 * on collecte ses `documents: string[]` et on dédupe par nom.
 *
 * Résultat : Map<docName, programIds[]> qui permet l'affichage du badge
 * "Réutilisé pour N candidatures".
 */
type DocAggregate = { name: string; programIds: string[] };

function aggregateDocs(planProgramIds: string[], savedProgramIds: string[]): DocAggregate[] {
  const allIds = Array.from(new Set([...planProgramIds, ...savedProgramIds]));
  const map = new Map<string, Set<string>>();
  for (const id of allIds) {
    const p = findProgram(id);
    if (!p) continue;
    for (const docName of p.documents) {
      if (!map.has(docName)) map.set(docName, new Set());
      map.get(docName)!.add(id);
    }
  }
  return Array.from(map.entries())
    .map(([name, ids]) => ({ name, programIds: Array.from(ids) }))
    .sort((a, b) => b.programIds.length - a.programIds.length);
}

export function DocumentsChecklist() {
  const planItems = usePlanStore((s) => s.items);
  const savedPlan = usePassportStore((s) => s.savedPlan);
  const metas = useDocumentsStore((s) => s.metas);
  const setStatus = useDocumentsStore((s) => s.setStatus);
  const setExpiresAt = useDocumentsStore((s) => s.setExpiresAt);

  const docs = useMemo(
    () => aggregateDocs(planItems.map((i) => i.programId), savedPlan.map((s) => s.programId)),
    [planItems, savedPlan],
  );

  const counts = useMemo(() => {
    const c: Record<DocStatus, number> = {
      todo: 0, requested: 0, received: 0, sent: 0, expired: 0,
    };
    for (const d of docs) {
      const s = metas[d.name]?.status ?? "todo";
      c[s]++;
    }
    return c;
  }, [docs, metas]);

  if (docs.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-black/5 p-6 text-center">
        <FileText size={20} className="mx-auto text-[#1a1d24]/40 mb-2" />
        <h3 className="font-medium text-[#1a1d24]">Aucun document à préparer</h3>
        <p className="text-sm text-[#1a1d24]/60 mt-1">
          Ajoute des programmes à ton{" "}
          <Link href="/passport" className="text-[#ee7768] hover:underline">plan</Link>{" "}
          ou sauvegarde-les depuis leur{" "}
          <Link href="/explore" className="text-[#ee7768] hover:underline">fiche</Link> :
          AkJol agrège ici les pièces demandées et déduplique celles que tu réutilises.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white border border-black/5 p-3 flex flex-wrap gap-2 text-[12px]">
        {STATUS_ORDER.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: STATUS_BG[s], color: STATUS_COLOR[s] }}
          >
            <strong className="font-mono">{counts[s]}</strong> {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      <ul className="space-y-2">
        {docs.map(({ name, programIds }) => (
          <DocumentRow
            key={name}
            name={name}
            usedIn={programIds.length}
            meta={metas[name]}
            onStatus={(s) => setStatus(name, s)}
            onExpiry={(iso) => setExpiresAt(name, iso || undefined)}
          />
        ))}
      </ul>

      <p className="text-[11px] text-[#1a1d24]/50">
        Les documents sont stockés localement (localStorage). Les statuts persistent entre
        sessions sur ce navigateur.
      </p>
    </div>
  );
}

function DocumentRow({
  name,
  usedIn,
  meta,
  onStatus,
  onExpiry,
}: {
  name: string;
  usedIn: number;
  meta: { status: DocStatus; expiresAt?: string; notes?: string } | undefined;
  onStatus: (s: DocStatus) => void;
  onExpiry: (iso: string) => void;
}) {
  const status = meta?.status ?? "todo";
  const days = expiryDaysLeft(meta?.expiresAt);
  const expiringSoon = days !== null && days >= 0 && days <= EXPIRY_WARNING_DAYS;
  const expired = days !== null && days < 0;

  const StatusIcon =
    status === "received" || status === "sent"
      ? CheckCircle2
      : status === "requested"
        ? Mail
        : status === "expired"
          ? AlertTriangle
          : Clock;

  return (
    <li className="rounded-xl bg-white border border-black/5 p-4">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: STATUS_BG[status], color: STATUS_COLOR[status] }}
        >
          <StatusIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h4 className="font-medium text-[#1a1d24]">{name}</h4>
            {usedIn > 1 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#ee776815] text-[#a8463a]">
                <Layers size={10} /> Réutilisé pour {usedIn} candidatures
              </span>
            ) : (
              <span className="text-[11px] text-[#1a1d24]/50">1 candidature</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px]">
            <label className="inline-flex items-center gap-1.5">
              <span className="text-[#1a1d24]/55">Statut :</span>
              <select
                value={status}
                onChange={(e) => onStatus(e.target.value as DocStatus)}
                className="rounded-md border border-black/10 bg-white px-2 py-0.5 outline-none focus:border-[#ee7768]"
                style={{ color: STATUS_COLOR[status] }}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-1.5">
              <span className="text-[#1a1d24]/55">Expire :</span>
              <input
                type="date"
                value={meta?.expiresAt ?? ""}
                onChange={(e) => onExpiry(e.target.value)}
                className="rounded-md border border-black/10 bg-white px-2 py-0.5 outline-none focus:border-[#ee7768]"
                style={{
                  color: expired ? "#7e2929" : expiringSoon ? "#8a5314" : "#1a1d24",
                }}
              />
            </label>

            {expired ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#7e2929]">
                <AlertTriangle size={11} /> Expiré il y a {Math.abs(days!)} j
              </span>
            ) : expiringSoon ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#8a5314]">
                <AlertTriangle size={11} /> Expire dans {days} j
              </span>
            ) : null}

            {status === "sent" ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#3a6f2c]">
                <Send size={11} /> Envoyé
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
