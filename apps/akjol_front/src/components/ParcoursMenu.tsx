"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  BookmarkPlus,
  ChevronRight,
  Copy,
  Download,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import type { Parcours } from "../store/parcours-store";
import { useParcoursStore } from "../store/parcours-store";
import { useTrajectoryStore } from "../store/trajectory-store";
import { useMounted } from "../hooks/useMounted";
import { findProgram } from "../data/programs";

const EMOJIS = ["🚀", "🎓", "🌍", "🧠", "⚙️", "🩺", "🎨", "💼", "🔭", "🌱"];

export function ParcoursMenu() {
  const mounted = useMounted();
  const router = useRouter();

  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const setFromOverride = useTrajectoryStore((s) => s.setFromOverride);

  const parcours = useParcoursStore((s) => s.parcours);
  const activeId = useParcoursStore((s) => s.activeParcoursId);
  const saveCurrent = useParcoursStore((s) => s.saveCurrentTrajectory);
  const remove = useParcoursStore((s) => s.deleteParcours);
  const duplicate = useParcoursStore((s) => s.duplicateParcours);
  const setActive = useParcoursStore((s) => s.setActiveParcoursId);
  const exportAsToken = useParcoursStore((s) => s.exportAsToken);
  const importFromToken = useParcoursStore((s) => s.importFromToken);

  const [open, setOpen] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>(EMOJIS[0]);
  const [importValue, setImportValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current || !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2200);
  }

  const hasTrajectory = steps.length > 0 || fromOverride !== null;

  function commitSave() {
    if (!name.trim()) return;
    saveCurrent({ name, emoji, fromOverride, steps });
    setName("");
    setEmoji(EMOJIS[0]);
    setShowSave(false);
    flash("Parcours enregistré");
  }

  function loadParcours(p: Parcours) {
    setFromOverride(p.fromOverride);
    useTrajectoryStore.setState({ steps: p.steps });
    setActive(p.id);
    setOpen(false);
    router.push("/explore");
  }

  async function shareParcours(p: Parcours) {
    const token = exportAsToken(p.id);
    if (!token) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?import=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("Lien copié");
    } catch {
      flash("Échec copie — utilise Exporter token");
    }
  }

  function exportToken(p: Parcours) {
    const token = exportAsToken(p.id);
    if (!token) return;
    navigator.clipboard.writeText(token).then(
      () => flash("Token copié"),
      () => flash("Échec copie"),
    );
  }

  function commitImport() {
    const raw = importValue.trim();
    const m = raw.match(/[?&]import=([^&]+)/);
    const token = m ? decodeURIComponent(m[1]) : raw;
    const id = importFromToken(token);
    if (id) {
      setImportValue("");
      setShowImport(false);
      setOpen(false);
      router.push(`/parcours/${id}`);
    } else {
      flash("Token invalide");
    }
  }

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-[#ee776815] text-[#a8463a]"
        suppressHydrationWarning
      >
        <Bookmark size={12} />
        <span className="hidden sm:inline">Mes parcours</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-[#ee776815] text-[#a8463a] hover:bg-[#ee776825] transition"
      >
        <Bookmark size={12} />
        <span className="hidden sm:inline">Mes parcours</span>
        {parcours.length > 0 ? <span className="opacity-70">({parcours.length})</span> : null}
      </button>

      {open ? (
        <div className="absolute top-full right-0 mt-2 z-30 w-[22rem] max-w-[calc(100vw-1rem)] rounded-xl bg-white border border-black/10 shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-black/5">
            <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold mb-1">
              Mes parcours
            </div>
            <p className="text-[11px] text-[#1a1d24]/55 leading-snug">
              Sauvegarde une suite d'étapes (Bac → Prépa → École…) pour y revenir plus tard. Ton{" "}
              <strong>passeport reste intact</strong> — un parcours s'applique sur ton vrai profil.
            </p>
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => {
                  setShowImport(true);
                  setShowSave(false);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-[#1a1d24]/60 hover:text-[#ee7768] px-2 py-1 rounded transition"
                title="Importer un parcours partagé"
              >
                <Upload size={11} /> Importer
              </button>
              <button
                onClick={() => {
                  setShowSave(true);
                  setShowImport(false);
                }}
                disabled={!hasTrajectory}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-[#ee7768] hover:bg-[#d96655] disabled:opacity-30 disabled:cursor-not-allowed rounded px-2 py-1 transition ml-auto"
                title={
                  hasTrajectory
                    ? "Sauvegarder le parcours en cours"
                    : "Construis d'abord un parcours (Continuer depuis ici)"
                }
              >
                <Plus size={11} /> Sauver le parcours actuel
              </button>
            </div>
          </div>

          {feedback ? (
            <div className="px-3 py-2 text-[11px] text-[#3a6f2c] bg-[#a3cf9120] border-b border-black/5">
              {feedback}
            </div>
          ) : null}

          {showSave ? (
            <div className="p-3 border-b border-black/5 bg-[#FAFAF7]">
              <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold mb-2">
                Nouveau parcours ({steps.length} étape{steps.length > 1 ? "s" : ""})
              </div>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className="w-7 h-7 rounded text-base transition"
                    style={{ background: emoji === e ? "#ee7768" : "#0000000a" }}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitSave()}
                placeholder="ex: Bac → Prépa MPSI → CentraleSupélec → Master IA"
                className="w-full rounded border border-black/10 bg-white px-2 py-1.5 text-sm focus:outline-none focus:border-[#ee7768]"
                autoFocus
              />
              <div className="flex gap-1 mt-2 justify-end">
                <button
                  onClick={() => setShowSave(false)}
                  className="text-[11px] px-2 py-1 text-[#1a1d24]/60 hover:text-[#1a1d24]"
                >
                  Annuler
                </button>
                <button
                  onClick={commitSave}
                  disabled={!name.trim()}
                  className="text-[11px] font-medium px-2 py-1 rounded bg-[#ee7768] text-white disabled:opacity-30"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          ) : null}

          {showImport ? (
            <div className="p-3 border-b border-black/5 bg-[#FAFAF7]">
              <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold mb-2">
                Importer un parcours
              </div>
              <textarea
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                placeholder="Colle ici un token ou une URL contenant ?import=…"
                className="w-full rounded border border-black/10 bg-white px-2 py-1.5 text-[12px] font-mono focus:outline-none focus:border-[#ee7768] min-h-[60px]"
              />
              <div className="flex gap-1 mt-2 justify-end">
                <button
                  onClick={() => setShowImport(false)}
                  className="text-[11px] px-2 py-1 text-[#1a1d24]/60 hover:text-[#1a1d24]"
                >
                  Annuler
                </button>
                <button
                  onClick={commitImport}
                  disabled={!importValue.trim()}
                  className="text-[11px] font-medium px-2 py-1 rounded bg-[#ee7768] text-white disabled:opacity-30"
                >
                  Importer
                </button>
              </div>
            </div>
          ) : null}

          <div className="max-h-80 overflow-y-auto">
            {parcours.length === 0 ? (
              <div className="p-5 text-center text-[12px] text-[#1a1d24]/55">
                <Sparkles size={18} className="mx-auto mb-2 text-[#ee7768]/40" />
                Aucun parcours sauvegardé.
                <br />
                Construis-en un avec « Continuer depuis ici » sur les fiches programmes, puis sauvegarde-le ici.
              </div>
            ) : (
              <ul>
                {parcours.map((p) => (
                  <li
                    key={p.id}
                    className="border-b border-black/5 last:border-b-0 hover:bg-black/[0.02]"
                    style={{ background: activeId === p.id ? "#ee776810" : undefined }}
                  >
                    <div className="flex items-start gap-2 p-3">
                      <Link
                        href={`/parcours/${p.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-2 flex-1 min-w-0 text-left"
                        title="Ouvrir le parcours pour le visualiser et l'éditer"
                      >
                        <span className="text-xl shrink-0 mt-0.5">{p.emoji ?? "🎓"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-[#1a1d24] text-sm truncate flex items-center gap-1">
                            {p.name}
                            {activeId === p.id ? (
                              <span className="text-[9px] uppercase font-semibold text-[#3a6f2c] bg-[#a3cf9120] rounded px-1 py-0.5 ml-1">
                                actif
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[10px] text-[#1a1d24]/55 mt-0.5 flex items-center gap-1 flex-wrap">
                            {p.fromOverride ? (
                              <span className="text-[#a8463a]">
                                depuis {p.fromOverride.label} ·
                              </span>
                            ) : null}
                            <span>
                              {p.steps.length} étape{p.steps.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#1a1d24]/45 mt-1 flex items-center gap-1 flex-wrap">
                            {p.steps.slice(0, 3).map((s) => (
                              <span key={s.programId} className="inline-flex items-center gap-0.5">
                                <span className="truncate max-w-[8rem]">
                                  {findProgram(s.programId)?.title.split(" — ")[0] ?? s.resultingDiplomaLabel}
                                </span>
                                <ChevronRight size={9} className="opacity-40" />
                              </span>
                            ))}
                            {p.steps.length > 3 ? <span>+{p.steps.length - 3}</span> : null}
                          </div>
                          <div className="text-[10px] text-[#1a1d24]/40 mt-1">
                            {new Date(p.updatedAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </Link>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => loadParcours(p)}
                          className="p-1 rounded text-[#a8463a] hover:bg-[#ee776820]"
                          title="Charger ce parcours (l'applique sur ton passeport)"
                        >
                          <Play size={11} />
                        </button>
                        <button
                          onClick={() => shareParcours(p)}
                          className="p-1 rounded text-[#1a1d24]/40 hover:text-[#ee7768] hover:bg-black/5"
                          title="Copier le lien de partage"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={() => exportToken(p)}
                          className="p-1 rounded text-[#1a1d24]/40 hover:text-[#ee7768] hover:bg-black/5"
                          title="Copier le token brut"
                        >
                          <Download size={11} />
                        </button>
                        <button
                          onClick={() => duplicate(p.id)}
                          className="p-1 rounded text-[#1a1d24]/40 hover:text-[#ee7768] hover:bg-black/5"
                          title="Dupliquer pour brancher une variante"
                        >
                          <BookmarkPlus size={11} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer « ${p.name} » ?`)) remove(p.id);
                          }}
                          className="p-1 rounded text-[#7e2929]/60 hover:text-[#7e2929] hover:bg-[#d9656510]"
                          title="Supprimer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
