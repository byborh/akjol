"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type Connection,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { Trash2, RotateCcw, History, Filter, Sparkles, ExternalLink } from "lucide-react";
import { DIPLOMAS } from "../../../data/diplomas";
import { COUNTRIES } from "../../../data/countries";
import {
  useEquivalencesStore,
  type EquivalenceEdge,
  type EquivalenceKind,
} from "../../../store/equivalences-store";

const KIND_COLOR: Record<EquivalenceKind, string> = {
  equivalent: "#3a6f2c",
  acceptedAs: "#8a5314",
  requiresBridge: "#a8463a",
  notRecognized: "#7e2929",
};

const KIND_LABEL: Record<EquivalenceKind, string> = {
  equivalent: "≡ équivalent",
  acceptedAs: "→ accepté comme",
  requiresBridge: "→ via passerelle",
  notRecognized: "✕ non reconnu",
};

function levelOrder(code: string): number {
  if (code.startsWith("BAC")) return 0;
  if (["A_LEVEL", "STPM", "SPM", "HS_DIPLOMA", "ABITUR"].includes(code)) return 0;
  if (code.startsWith("BTS")) return 2;
  if (code.startsWith("DUT") || code === "LICENCE_INFO") return 3;
  return 1;
}

function buildInitialNodes(filterCountry: string, filterLevel: string | null): Node[] {
  return DIPLOMAS.filter((d) => {
    if (filterCountry !== "ALL" && d.countryRef !== filterCountry) return false;
    if (filterLevel !== null && String(levelOrder(d.code)) !== filterLevel) return false;
    return true;
  }).map((d, i) => ({
    id: d.code,
    position: {
      x: (i % 4) * 240,
      y: Math.floor(i / 4) * 130,
    },
    data: {
      label: (
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-wider text-white/60">{d.countryRef}</div>
          <div className="font-medium text-sm text-white">{d.nativeName}</div>
          <div className="text-[10px] text-white/50 mt-0.5">{d.code} · /{d.scaleMax}</div>
        </div>
      ),
    },
    style: {
      background: "#1a1d24",
      color: "white",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      padding: 10,
      width: 210,
    },
  }));
}

function toRfEdges(edges: EquivalenceEdge[], visibleNodeIds: Set<string>): Edge[] {
  return edges
    .filter((e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to))
    .map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      label: KIND_LABEL[e.kind],
      labelStyle: { fontSize: 10, fill: KIND_COLOR[e.kind], fontWeight: 600 },
      labelBgStyle: { fill: "#FAFAF7" },
      style: {
        stroke: KIND_COLOR[e.kind],
        strokeWidth: 1 + e.weight * 1.5,
        strokeDasharray: e.kind === "notRecognized" ? "4 3" : undefined,
      },
      animated: e.kind === "requiresBridge",
    }));
}

export default function AdminGraphPage() {
  const edges = useEquivalencesStore((s) => s.edges);
  const history = useEquivalencesStore((s) => s.history);
  const add = useEquivalencesStore((s) => s.add);
  const update = useEquivalencesStore((s) => s.update);
  const remove = useEquivalencesStore((s) => s.remove);
  const reset = useEquivalencesStore((s) => s.reset);

  const [filterCountry, setFilterCountry] = useState<string>("ALL");
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [nodes, setNodes] = useState<Node[]>(() => buildInitialNodes("ALL", null));

  useEffect(() => {
    setNodes(buildInitialNodes(filterCountry, filterLevel));
  }, [filterCountry, filterLevel]);

  const visibleNodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const rfEdges = useMemo(() => toRfEdges(edges, visibleNodeIds), [edges, visibleNodeIds]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      add({ from: c.source, to: c.target, kind: "acceptedAs", weight: 0.7 });
    },
    [add],
  );

  const onEdgeClick: EdgeMouseHandler = useCallback((_, e) => {
    setSelectedEdge(e.id);
  }, []);

  const sel = edges.find((e) => e.id === selectedEdge) ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-2rem)]">
      <div className="px-4 py-2 border-b border-[#a3cf91]/30 bg-[#fafff5] text-[12px] text-[#3a6f2c] flex items-center gap-2 flex-wrap">
        <Sparkles size={12} className="shrink-0" />
        <span>
          <strong>Tes éditions affectent maintenant le moteur.</strong> Crée une arête{" "}
          <code>equivalent</code> ou <code>acceptedAs</code> entre deux diplômes et les programmes
          dont les <code>acceptedDiplomas</code> contiennent la cible deviennent ouverts pour qui
          tient le diplôme source.
        </span>
        <Link
          href="/explore"
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 font-medium hover:underline"
        >
          Voir l'effet sur /explore <ExternalLink size={11} />
        </Link>
      </div>
      <div className="px-4 py-3 border-b border-black/5 bg-white flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-medium tracking-tight mr-3">Graphe d'équivalences</h1>

        <div className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-[#fafaf7] rounded-md text-xs">
          <Filter size={12} className="text-[#1a1d24]/50" />
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-transparent outline-none"
          >
            <option value="ALL">Tous pays</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-[#fafaf7] rounded-md text-xs">
          <select
            value={filterLevel ?? ""}
            onChange={(e) => setFilterLevel(e.target.value || null)}
            className="bg-transparent outline-none"
          >
            <option value="">Tous niveaux</option>
            <option value="0">Bac / Lycée</option>
            <option value="2">Bac+2</option>
            <option value="3">Bac+3</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#fafaf7] hover:bg-[#1a1d2410]"
          >
            <History size={12} /> Historique ({history.length})
          </button>
          <button
            onClick={() => {
              if (confirm("Réinitialiser aux équivalences seed ?")) reset();
            }}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#fafaf7] hover:bg-[#1a1d2410]"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onPaneClick={() => setSelectedEdge(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#1a1d2418" gap={20} />
          <MiniMap
            nodeColor={() => "#1a1d24"}
            maskColor="rgba(250,250,247,0.6)"
            style={{ background: "#FAFAF7" }}
          />
          <Controls />
          <Panel position="top-left" className="!m-3">
            <div className="bg-white rounded-md shadow-sm border border-black/5 px-3 py-2 text-[11px] text-[#1a1d24]/70 max-w-[260px]">
              Tire entre deux nœuds pour créer une équivalence. Clique une arête pour l'éditer.
            </div>
          </Panel>
        </ReactFlow>

        {sel ? (
          <EdgeEditor
            edge={sel}
            onChange={(patch) => update(sel.id, patch)}
            onDelete={() => {
              remove(sel.id);
              setSelectedEdge(null);
            }}
            onClose={() => setSelectedEdge(null)}
          />
        ) : null}

        {showHistory ? (
          <div className="absolute right-3 top-3 w-[300px] max-h-[60vh] overflow-auto bg-white rounded-lg border border-black/5 shadow-lg p-3 text-[12px]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Révisions</span>
              <button onClick={() => setShowHistory(false)} className="text-[#1a1d24]/50">
                ✕
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-[#1a1d24]/60">Aucune révision encore.</p>
            ) : (
              <ul className="space-y-1">
                {history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="text-[#1a1d24]/70 font-mono">
                      {new Date(h.at).toLocaleString("fr-FR")}
                    </span>
                    <button
                      onClick={() => useEquivalencesStore.getState().revertTo(i)}
                      className="text-[#ee7768] hover:underline"
                    >
                      Revert
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EdgeEditor({
  edge,
  onChange,
  onDelete,
  onClose,
}: {
  edge: EquivalenceEdge;
  onChange: (patch: Partial<EquivalenceEdge>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const KINDS: EquivalenceKind[] = ["equivalent", "acceptedAs", "requiresBridge", "notRecognized"];
  return (
    <div className="absolute right-3 bottom-3 w-[320px] bg-white rounded-lg border border-black/5 shadow-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#1a1d24]/60">
          Arête sélectionnée
        </span>
        <button onClick={onClose} className="text-[#1a1d24]/50">
          ✕
        </button>
      </div>
      <div className="text-sm font-mono text-[#1a1d24]/80 mb-3">
        {edge.from} → {edge.to}
      </div>
      <label className="block text-[11px] text-[#1a1d24]/70 mb-1">Type</label>
      <div className="flex flex-wrap gap-1 mb-3">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => onChange({ kind: k })}
            className="text-[11px] px-2 py-1 rounded-md transition"
            style={{
              background: edge.kind === k ? KIND_COLOR[k] + "20" : "#fafaf7",
              color: edge.kind === k ? KIND_COLOR[k] : "#1a1d2480",
              border: "1px solid " + (edge.kind === k ? KIND_COLOR[k] + "40" : "transparent"),
            }}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <label className="block text-[11px] text-[#1a1d24]/70 mb-1">
        Poids ({edge.weight.toFixed(2)})
      </label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={edge.weight}
        onChange={(e) => onChange({ weight: Number(e.target.value) })}
        className="w-full mb-3"
      />
      <label className="block text-[11px] text-[#1a1d24]/70 mb-1">Note</label>
      <textarea
        value={edge.note ?? ""}
        onChange={(e) => onChange({ note: e.target.value })}
        rows={2}
        className="w-full text-[12px] rounded-md border border-black/10 px-2 py-1.5 outline-none focus:border-[#ee7768]"
        placeholder="Justification, source, jurisprudence…"
      />
      <button
        onClick={onDelete}
        className="mt-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#d9656520] text-[#7e2929] hover:bg-[#d9656530]"
      >
        <Trash2 size={12} /> Supprimer
      </button>
    </div>
  );
}
