"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkPlus, Check, Copy, Download, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { useLivesStore } from "../store/lives-store";
import { usePassportStore } from "../store/passport-store";
import { useTrajectoryStore } from "../store/trajectory-store";
import type { Life } from "../store/lives-store";
import { useMounted } from "../hooks/useMounted";

const EMOJIS = ["🚀", "🎓", "🌍", "🧠", "⚙️", "🩺", "🎨", "💼", "🔭", "🌱"];

export function LivesMenu() {
  const mounted = useMounted();
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const setPassport = usePassportStore((s) => s.setPassport);
  const savedPlan = usePassportStore((s) => s.savedPlan);
  const setSavedFromIds = usePassportStore((s) => s.setSavedPrograms);

  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const setFromOverride = useTrajectoryStore((s) => s.setFromOverride);

  const lives = useLivesStore((s) => s.lives);
  const activeLifeId = useLivesStore((s) => s.activeLifeId);
  const saveCurrentAsLife = useLivesStore((s) => s.saveCurrentAsLife);
  const updateLife = useLivesStore((s) => s.updateLife);
  const deleteLife = useLivesStore((s) => s.deleteLife);
  const duplicateLife = useLivesStore((s) => s.duplicateLife);
  const setActiveLifeId = useLivesStore((s) => s.setActiveLifeId);
  const exportLifeAsToken = useLivesStore((s) => s.exportLifeAsToken);
  const importLifeFromToken = useLivesStore((s) => s.importLifeFromToken);

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
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2200);
  }

  function commitSave() {
    if (!name.trim()) return;
    saveCurrentAsLife({
      name,
      emoji,
      passport,
      trajectory: { fromOverride, steps },
      savedPrograms: savedPlan.map((s) => s.programId),
    });
    setName("");
    setEmoji(EMOJIS[0]);
    setShowSave(false);
    flash("Vie enregistrée");
  }

  function loadLife(life: Life) {
    setPassport(life.passport);
    setFromOverride(life.trajectory.fromOverride);
    useTrajectoryStore.setState({ steps: life.trajectory.steps });
    setSavedFromIds(life.savedPrograms);
    setActiveLifeId(life.id);
    setOpen(false);
    flash(`« ${life.name} » chargée`);
  }

  async function shareLife(life: Life) {
    const token = exportLifeAsToken(life.id);
    if (!token) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?import=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("Lien copié dans le presse-papier");
    } catch {
      flash("Impossible de copier — utilise le bouton Exporter");
    }
  }

  function exportToken(life: Life) {
    const token = exportLifeAsToken(life.id);
    if (!token) return;
    navigator.clipboard.writeText(token).then(
      () => flash("Token copié"),
      () => flash("Erreur copie"),
    );
  }

  function commitImport() {
    const id = importLifeFromToken(importValue);
    if (id) {
      setImportValue("");
      setShowImport(false);
      flash("Vie importée");
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
        Mes vies
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
        Mes vies {lives.length > 0 ? <span className="opacity-70">({lives.length})</span> : null}
      </button>

      {open ? (
        <div className="absolute top-full right-0 mt-2 z-30 w-80 rounded-xl bg-white border border-black/10 shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-black/5 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold">
              Mes simulations
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setShowImport(true);
                  setShowSave(false);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-[#1a1d24]/60 hover:text-[#ee7768] px-1.5 py-0.5"
                title="Importer une vie partagée"
              >
                <Upload size={11} /> Importer
              </button>
              <button
                onClick={() => {
                  setShowSave(true);
                  setShowImport(false);
                }}
                disabled={!isComplete}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-[#ee7768] hover:bg-[#d96655] disabled:opacity-30 disabled:cursor-not-allowed rounded px-2 py-1 transition"
                title={isComplete ? "Sauvegarder l'état actuel comme une vie" : "Crée d'abord ton passeport"}
              >
                <Plus size={11} /> Sauver
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
                Nouvelle vie
              </div>
              <div className="flex gap-1.5 mb-2">
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
                placeholder="ex: Léa devient ingé via prépa ATS"
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
                Importer un token / un lien
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
                  onClick={() => {
                    const m = importValue.match(/[?&]import=([^&]+)/);
                    if (m) setImportValue(decodeURIComponent(m[1]));
                    commitImport();
                  }}
                  disabled={!importValue.trim()}
                  className="text-[11px] font-medium px-2 py-1 rounded bg-[#ee7768] text-white disabled:opacity-30"
                >
                  Importer
                </button>
              </div>
            </div>
          ) : null}

          <div className="max-h-72 overflow-y-auto">
            {lives.length === 0 ? (
              <div className="p-4 text-center text-[12px] text-[#1a1d24]/50">
                <Sparkles size={16} className="mx-auto mb-2 text-[#ee7768]/40" />
                Aucune vie sauvegardée pour l'instant.
                <br />
                Crée des trajectoires et sauve-les pour pouvoir les comparer plus tard.
              </div>
            ) : (
              <ul>
                {lives.map((life) => (
                  <li
                    key={life.id}
                    className="border-b border-black/5 last:border-b-0 hover:bg-black/[0.02]"
                    style={{ background: activeLifeId === life.id ? "#ee776810" : undefined }}
                  >
                    <div className="flex items-start gap-2 p-3">
                      <span className="text-xl shrink-0 mt-0.5">{life.emoji ?? "🎓"}</span>
                      <button
                        onClick={() => loadLife(life)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="font-medium text-[#1a1d24] text-sm truncate flex items-center gap-1">
                          {life.name}
                          {activeLifeId === life.id ? (
                            <Check size={11} className="text-[#3a6f2c] shrink-0" />
                          ) : null}
                        </div>
                        <div className="text-[10px] text-[#1a1d24]/50 mt-0.5 flex items-center gap-2">
                          <span>{life.passport.currentDiploma?.label ?? "—"}</span>
                          {life.trajectory.steps.length ? (
                            <span className="text-[#ee7768]">+{life.trajectory.steps.length} étape{life.trajectory.steps.length > 1 ? "s" : ""}</span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-[#1a1d24]/40 mt-0.5">
                          {new Date(life.updatedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </button>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => shareLife(life)}
                          className="p-1 rounded text-[#1a1d24]/40 hover:text-[#ee7768] hover:bg-black/5"
                          title="Copier le lien de partage"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={() => exportToken(life)}
                          className="p-1 rounded text-[#1a1d24]/40 hover:text-[#ee7768] hover:bg-black/5"
                          title="Copier le token brut"
                        >
                          <Download size={11} />
                        </button>
                        <button
                          onClick={() => duplicateLife(life.id)}
                          className="p-1 rounded text-[#1a1d24]/40 hover:text-[#ee7768] hover:bg-black/5"
                          title="Dupliquer pour brancher une variante"
                        >
                          <BookmarkPlus size={11} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer « ${life.name} » ?`)) deleteLife(life.id);
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
