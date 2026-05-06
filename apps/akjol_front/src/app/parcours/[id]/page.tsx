"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Download,
  Languages,
  MapPin,
  Pencil,
  Play,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { PageContainer } from "../../../components/PageContainer";
import { useParcoursStore } from "../../../store/parcours-store";
import { useTrajectoryStore } from "../../../store/trajectory-store";
import { useMounted } from "../../../hooks/useMounted";
import { findProgram } from "../../../data/programs";
import { findCountry } from "../../../data/countries";
import { findSchoolByProgram } from "../../../data/schools";

const EMOJIS = ["🚀", "🎓", "🌍", "🧠", "⚙️", "🩺", "🎨", "💼", "🔭", "🌱"];

export default function ParcoursDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const mounted = useMounted();
  const { id } = use(params);

  const parcours = useParcoursStore((s) => s.parcours.find((p) => p.id === id));
  const updateParcours = useParcoursStore((s) => s.updateParcours);
  const deleteParcours = useParcoursStore((s) => s.deleteParcours);
  const duplicateParcours = useParcoursStore((s) => s.duplicateParcours);
  const setActive = useParcoursStore((s) => s.setActiveParcoursId);
  const exportAsToken = useParcoursStore((s) => s.exportAsToken);
  const activeId = useParcoursStore((s) => s.activeParcoursId);

  const setFromOverride = useTrajectoryStore((s) => s.setFromOverride);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingEmoji, setEditingEmoji] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (parcours) setNoteDraft(parcours.note ?? "");
  }, [parcours?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2200);
  }

  const enrichedSteps = useMemo(() => {
    if (!parcours) return [];
    return parcours.steps.map((s) => ({
      step: s,
      program: findProgram(s.programId),
    }));
  }, [parcours]);

  const totalYears = useMemo(() => {
    if (!parcours) return 0;
    return parcours.steps.reduce((sum, s) => sum + s.yearsAdded, 0);
  }, [parcours]);

  const totalCost = useMemo(() => {
    if (!parcours) return 0;
    return parcours.steps.reduce((sum, s) => {
      const p = findProgram(s.programId);
      return sum + (p ? p.costPerYear * p.durationYears : 0);
    }, 0);
  }, [parcours]);

  if (!mounted) return null;
  if (!parcours) return notFound();

  function load() {
    if (!parcours) return;
    setFromOverride(parcours.fromOverride);
    useTrajectoryStore.setState({ steps: parcours.steps });
    setActive(parcours.id);
    router.push("/explore");
  }

  function startEditName() {
    if (!parcours) return;
    setNameDraft(parcours.name);
    setEditingName(true);
  }
  function commitName() {
    if (!parcours) return;
    const next = nameDraft.trim();
    if (next && next !== parcours.name) {
      updateParcours(parcours.id, { name: next });
      flash("Nom mis à jour");
    }
    setEditingName(false);
  }

  function pickEmoji(e: string) {
    if (!parcours) return;
    updateParcours(parcours.id, { emoji: e });
    setEditingEmoji(false);
  }

  function commitNote() {
    if (!parcours) return;
    const next = noteDraft.trim();
    if (next !== (parcours.note ?? "")) {
      updateParcours(parcours.id, { note: next || undefined });
      flash("Note mise à jour");
    }
  }

  function removeStep(programId: string) {
    if (!parcours) return;
    const next = parcours.steps.filter((s) => s.programId !== programId);
    useParcoursStore.setState({
      parcours: useParcoursStore.getState().parcours.map((p) =>
        p.id === parcours.id
          ? { ...p, steps: next, updatedAt: new Date().toISOString() }
          : p,
      ),
    });
    flash("Étape retirée");
  }

  function clearFromOverride() {
    if (!parcours) return;
    useParcoursStore.setState({
      parcours: useParcoursStore.getState().parcours.map((p) =>
        p.id === parcours.id
          ? { ...p, fromOverride: null, updatedAt: new Date().toISOString() }
          : p,
      ),
    });
    flash("Point de départ retiré");
  }

  async function shareLink() {
    if (!parcours) return;
    const token = exportAsToken(parcours.id);
    if (!token) return;
    const url = `${window.location.origin}/?import=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("Lien copié");
    } catch {
      flash("Échec copie");
    }
  }

  function exportToken() {
    if (!parcours) return;
    const token = exportAsToken(parcours.id);
    if (!token) return;
    navigator.clipboard.writeText(token).then(
      () => flash("Token copié"),
      () => flash("Échec copie"),
    );
  }

  function dup() {
    if (!parcours) return;
    const newId = duplicateParcours(parcours.id);
    if (newId) router.push(`/parcours/${newId}`);
  }

  function remove() {
    if (!parcours) return;
    if (confirm(`Supprimer « ${parcours.name} » ? Cette action est définitive.`)) {
      deleteParcours(parcours.id);
      router.push("/");
    }
  }

  const fromCountry = parcours.fromOverride ? findCountry(parcours.fromOverride.countryRef) : null;

  return (
    <PageContainer>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-4"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <div className="rounded-2xl bg-white border border-black/5 p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <button
              onClick={() => setEditingEmoji((v) => !v)}
              className="text-5xl hover:scale-110 transition"
              title="Changer l'emoji"
            >
              {parcours.emoji ?? "🎓"}
            </button>
            {editingEmoji ? (
              <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-black/10 rounded-xl shadow-lg p-2 flex gap-1 flex-wrap w-48">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => pickEmoji(e)}
                    className="w-8 h-8 rounded text-lg hover:bg-black/5"
                    style={{ background: parcours.emoji === e ? "#ee776820" : undefined }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-[#1a1d24]/45 font-semibold">
                Parcours sauvegardé
              </span>
              {activeId === parcours.id ? (
                <span className="text-[9px] uppercase font-semibold text-[#3a6f2c] bg-[#a3cf9120] rounded px-1.5 py-0.5">
                  actif
                </span>
              ) : null}
            </div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="text-2xl font-medium tracking-tight bg-transparent border-b-2 border-[#ee7768] outline-none flex-1"
                  autoFocus
                />
                <button
                  onClick={commitName}
                  className="p-1.5 rounded text-[#3a6f2c] hover:bg-[#a3cf9120]"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="p-1.5 rounded text-[#1a1d24]/40 hover:bg-black/5"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditName}
                className="group inline-flex items-center gap-2 text-2xl sm:text-3xl font-medium tracking-tight text-[#1a1d24] text-left"
              >
                <span>{parcours.name}</span>
                <Pencil size={14} className="text-[#1a1d24]/30 group-hover:text-[#ee7768] transition" />
              </button>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[12px] text-[#1a1d24]/65">
              <span className="inline-flex items-center gap-1">
                {parcours.steps.length} étape{parcours.steps.length > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
                <Clock size={12} /> {totalYears} an{totalYears > 1 ? "s" : ""} cumulé
                {totalYears > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
                <Coins size={12} />{" "}
                {totalCost === 0 ? "Gratuit" : `~${totalCost.toLocaleString("fr-FR")} € total scolarité`}
              </span>
              <span className="text-[#1a1d24]/45">
                Créé le{" "}
                {new Date(parcours.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {feedback ? (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#a3cf9120] text-[#3a6f2c] text-[12px]">
            <Check size={12} /> {feedback}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 mt-5">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white text-sm transition"
            style={{ background: "#ee7768" }}
            title="Applique ce parcours sur ton passeport et ouvre /explore"
          >
            <Play size={14} /> Charger ce parcours
            <ArrowRight size={14} />
          </button>
          <button
            onClick={shareLink}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm border border-black/10 hover:border-[#ee7768] transition"
          >
            <Copy size={13} /> Lien de partage
          </button>
          <button
            onClick={exportToken}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm border border-black/10 hover:border-[#ee7768] transition"
            title="Copier le token brut"
          >
            <Download size={13} /> Token
          </button>
          <button
            onClick={dup}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm border border-black/10 hover:border-[#ee7768] transition"
          >
            <BookmarkPlus size={13} /> Dupliquer
          </button>
          <button
            onClick={remove}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm border border-[#d96565]/30 text-[#7e2929] hover:bg-[#d9656510] transition ml-auto"
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      </div>

      {parcours.fromOverride ? (
        <div className="rounded-xl bg-[#ee776810] border border-[#ee7768]/20 px-4 py-3 mb-4 flex items-center gap-3">
          <Sparkles size={14} className="text-[#a8463a] shrink-0" />
          <div className="text-[12px] text-[#a8463a] flex-1">
            Ce parcours suppose un point de départ <strong>virtuel</strong> :{" "}
            <span className="font-semibold">
              {fromCountry?.flag} {parcours.fromOverride.label}
            </span>
            . Ton passeport réel n'est pas utilisé pour ce parcours.
          </div>
          <button
            onClick={clearFromOverride}
            className="text-[11px] text-[#a8463a]/70 hover:text-[#a8463a] underline shrink-0"
          >
            Retirer
          </button>
        </div>
      ) : null}

      <h2 className="text-lg font-medium tracking-tight mb-3">Étapes</h2>
      {enrichedSteps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 bg-white px-5 py-8 text-center text-sm text-[#1a1d24]/50">
          Ce parcours n'a aucune étape.
          <br />
          <Link href="/explore" className="text-[#ee7768] hover:underline font-medium">
            Va sur Explorer
          </Link>{" "}
          et clique « Continuer depuis ici » pour en ajouter.
        </div>
      ) : (
        <ol className="space-y-3">
          {enrichedSteps.map(({ step, program }, i) => {
            const country = program ? findCountry(program.countryRef) : null;
            const school = program ? findSchoolByProgram(program) : null;
            return (
              <li
                key={step.programId}
                className="rounded-xl bg-white border border-black/5 p-4 flex gap-4"
              >
                <div
                  className="shrink-0 w-9 h-9 rounded-full bg-[#ee7768]/10 text-[#a8463a] flex items-center justify-center text-sm font-semibold"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {program ? (
                    <Link
                      href={`/program/${program.id}`}
                      className="font-medium text-[#1a1d24] hover:text-[#ee7768] transition"
                    >
                      {program.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-[#7e2929]">
                      Programme introuvable ({step.programId})
                    </span>
                  )}
                  {program ? (
                    <div className="text-[12px] text-[#1a1d24]/60 mt-0.5 inline-flex items-center gap-1.5">
                      <Building2 size={11} />
                      {school ? (
                        <Link
                          href={`/school/${school.id}`}
                          className="hover:text-[#ee7768] hover:underline"
                        >
                          {program.school.name}
                        </Link>
                      ) : (
                        program.school.name
                      )}
                      <span>·</span>
                      <MapPin size={11} /> {country?.flag} {program.school.city}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[#1a1d24]/55">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {step.yearsAdded} an{step.yearsAdded > 1 ? "s" : ""}
                    </span>
                    {program ? (
                      <span className="inline-flex items-center gap-1">
                        <Languages size={11} /> {program.language.code.toUpperCase()}{" "}
                        {program.language.minLevel}
                      </span>
                    ) : null}
                    {program ? (
                      <span className="inline-flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
                        <Coins size={11} />{" "}
                        {program.costPerYear === 0
                          ? "Gratuit"
                          : `${program.costPerYear.toLocaleString("fr-FR")} €/an`}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-[#3a6f2c] mt-2 inline-flex items-center gap-1">
                    <ChevronRight size={11} className="text-[#1a1d24]/30" />
                    Donne le diplôme :{" "}
                    <span className="font-medium text-[#1a1d24]">{step.resultingDiplomaLabel}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeStep(step.programId)}
                  className="shrink-0 self-start p-1.5 rounded text-[#1a1d24]/30 hover:text-[#7e2929] hover:bg-[#d9656510] transition"
                  title="Retirer cette étape du parcours"
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 rounded-xl bg-white border border-black/5 p-4">
        <details>
          <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold inline-flex items-center gap-1">
            <ChevronDown size={11} /> Note personnelle
          </summary>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={commitNote}
            placeholder="Pourquoi ce parcours te plaît, doutes, plan B…"
            className="mt-2 w-full rounded-lg border border-black/10 bg-white p-3 text-sm focus:outline-none focus:border-[#ee7768] min-h-[80px]"
          />
          <div className="text-[10px] text-[#1a1d24]/40 mt-1">Sauvegardé automatiquement à la perte de focus.</div>
        </details>
      </div>
    </PageContainer>
  );
}
