"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type NodeMouseHandler,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { findCountry } from "../data/countries";
import { findProgram } from "../data/programs";
import type { FromOverride, Passport, TrajectoryStep } from "../types";

/**
 * Visualisation horizontale d'une trajectoire :
 *   [START]  →  [ÉTAPE 1]  →  [ÉTAPE 2]  →  [DIPLÔME FINAL]
 *
 * Le composant est read-only : pas de drag, pas de zoom, pas de connect.
 * On utilise React Flow (déjà dans le bundle pour /admin/graph) plutôt qu'un
 * layout HTML maison parce que :
 *   - le user a explicitement demandé "node/edge"
 *   - React Flow gère déjà les arêtes incurvées + flèches + labels
 *   - on hérite gratuitement du fitView, mini-zoom au resize
 */

const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;
const GAP_X = 48;

type Props = {
  /** Le passeport sert de point de départ par défaut. */
  passport: Passport;
  /** Si présent, override le point de départ (cas trajectoire virtuelle). */
  fromOverride?: FromOverride | null;
  /** Suite des programmes empilés. */
  steps: TrajectoryStep[];
  /** Optionnel : un métier-cible affiché comme nœud terminal. */
  targetJobLabel?: string;
  /** Hauteur du canvas. */
  height?: number;
};

export function TrajectoryFlow({
  passport,
  fromOverride,
  steps,
  targetJobLabel,
  height = 220,
}: Props) {
  const router = useRouter();
  const { nodes, edges } = useMemo(
    () => buildGraph(passport, fromOverride ?? null, steps, targetJobLabel),
    [passport, fromOverride, steps, targetJobLabel],
  );

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      // Les nœuds-étape ont un programId attaché dans node.data.programId.
      // Les nœuds start/end ne sont pas navigables.
      const programId = (node.data as { programId?: string }).programId;
      if (programId) router.push(`/program/${programId}`);
    },
    [router],
  );

  if (steps.length === 0 && !fromOverride) {
    return (
      <div
        className="rounded-xl border border-dashed border-black/10 bg-[#fafaf7] flex items-center justify-center text-[12px] text-[#1a1d24]/50"
        style={{ height }}
      >
        Aucune étape pour l'instant — empile des programmes via « Continuer depuis ici » sur /explore.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white overflow-hidden" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll={false}
        panOnDrag={true}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.18, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1a1d2410" gap={18} />
      </ReactFlow>
    </div>
  );
}

function buildGraph(
  passport: Passport,
  fromOverride: FromOverride | null,
  steps: TrajectoryStep[],
  targetJobLabel?: string,
): { nodes: Node[]; edges: Edge[] } {
  const startCountry = fromOverride?.countryRef ?? passport.origin.country ?? "FR";
  const startCountryMeta = findCountry(startCountry);
  const startLabel = fromOverride
    ? fromOverride.label
    : passport.currentDiploma?.label ?? "Profil de départ";

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // START
  nodes.push({
    id: "start",
    type: "default",
    position: { x: 0, y: 0 },
    data: {
      label: (
        <div className="text-left p-1">
          <div className="text-[9px] uppercase tracking-wider text-white/55 font-semibold">
            Tu pars de
          </div>
          <div className="text-sm font-medium text-white truncate">
            {startCountryMeta?.flag ?? "🌍"} {startLabel}
          </div>
          {fromOverride ? (
            <div className="text-[9px] uppercase tracking-wider mt-1 text-[#ff9b8c]">
              point virtuel
            </div>
          ) : (
            <div className="text-[9px] uppercase tracking-wider mt-1 text-white/40">
              passeport réel
            </div>
          )}
        </div>
      ),
    },
    style: {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      background: "#1a1d24",
      color: "white",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 12,
      padding: 0,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  // STEPS
  let prevId = "start";
  steps.forEach((step, i) => {
    const program = findProgram(step.programId);
    const country = findCountry(step.countryRef);
    const id = `step-${i}`;
    nodes.push({
      id,
      type: "default",
      position: { x: (i + 1) * (NODE_WIDTH + GAP_X), y: 0 },
      data: {
        programId: step.programId,
        label: (
          <div className="text-left p-1">
            <div className="text-[9px] uppercase tracking-wider text-[#a8463a] font-semibold">
              Étape {i + 1} · clique pour la fiche
            </div>
            <div className="text-[12px] font-medium leading-tight text-[#1a1d24] line-clamp-2">
              {program?.title ?? step.programId}
            </div>
            <div className="text-[10px] text-[#1a1d24]/65 truncate mt-1">
              {country?.flag ?? "🌍"} {program?.school.name ?? ""}
            </div>
            <div className="text-[10px] text-[#1a1d24]/55 mt-1 inline-flex gap-2" style={{ fontFamily: "var(--font-mono)" }}>
              <span>{step.yearsAdded} an{step.yearsAdded > 1 ? "s" : ""}</span>
              {program ? (
                <span>·{" "}{program.costPerYear === 0 ? "Gratuit" : `${program.costPerYear} €/an`}</span>
              ) : null}
            </div>
          </div>
        ),
      },
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: "#fff",
        border: "1.5px solid #ee776850",
        borderRadius: 12,
        padding: 0,
        cursor: "pointer",
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    edges.push({
      id: `e-${prevId}-${id}`,
      source: prevId,
      target: id,
      type: "smoothstep",
      animated: false,
      label: step.resultingDiplomaLabel,
      labelStyle: { fontSize: 10, fontWeight: 600, fill: "#3a6f2c" },
      labelBgStyle: { fill: "#fafaf7" },
      labelBgPadding: [4, 2],
      style: { stroke: "#ee776880", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#ee7768" },
    });
    prevId = id;
  });

  // END (job ou diplôme final)
  if (targetJobLabel) {
    const id = "end";
    nodes.push({
      id,
      type: "default",
      position: { x: (steps.length + 1) * (NODE_WIDTH + GAP_X), y: 0 },
      data: {
        label: (
          <div className="text-left p-1">
            <div className="text-[9px] uppercase tracking-wider text-white/55 font-semibold">
              Cible métier
            </div>
            <div className="text-sm font-medium text-white truncate">{targetJobLabel}</div>
          </div>
        ),
      },
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: "#3a6f2c",
        color: "white",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 0,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    edges.push({
      id: `e-${prevId}-${id}`,
      source: prevId,
      target: id,
      type: "smoothstep",
      style: { stroke: "#3a6f2c", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#3a6f2c" },
    });
  }

  return { nodes, edges };
}
