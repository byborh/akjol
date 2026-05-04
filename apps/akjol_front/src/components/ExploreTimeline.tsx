/**
 * src/components/ExploreTimeline.tsx
 * 
 * Navigation horizontale "Timeline Inversée"
 * Avec animations fluides via Framer Motion
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import type { Node, ExploreState, UserStats, RandomEvent, School, UserPathStep } from '../types';
import { useData } from '../contexts/DataContext';
import { MOCK_USER_STATS } from '../data/mockData';
import { calculateSuccessProbability } from '../services/probabilityService';
import { rollForEvent, applyEventEffects } from '../services/eventService';
import NodeCard from './NodeCard';
import BreakingNewsModal from './BreakingNewsModal';
import SchoolSelector from './SchoolSelector';

interface EnrichedNode extends Node {
  successProbability: number;
  riskLevel: 'safe' | 'medium' | 'risky';
}

interface ExploreTimelineProps {
  startingNodeId: number;
  userStats?: UserStats; // Optionnel, utilise les mock stats par défaut
  initialPath?: UserPathStep[];
  onPathChange?: (path: UserPathStep[]) => void;
  onShowFormationDetails?: (nodeId: number) => void;
}

/**
 * Enrichit un node avec sa probabilité de succès
 */
function enrichNodeWithProbability(node: Node, userStats: UserStats): EnrichedNode {
  const result = calculateSuccessProbability(userStats, node.requirements);
  return {
    ...node,
    successProbability: result.probability,
    riskLevel: result.riskLevel
  };
}

type TimelineColumn = {
  label: string;
  nodes: Node[];
  isCurrent: boolean;
};

export const ExploreTimeline: React.FC<ExploreTimelineProps> = ({ 
  startingNodeId,
  userStats: initialUserStats = MOCK_USER_STATS,
  initialPath,
  onPathChange,
  onShowFormationDetails
}) => {
  const { nodes, getSchoolsByNodeId, getNextPathways, getNodeById, pruneUnusedData } = useData();
  
  const startingNode = useMemo(
    () => getNodeById(startingNodeId) ?? null,
    [startingNodeId, getNodeById]
  );
  const fallbackSchool = useMemo(
    () => getSchoolsByNodeId(startingNodeId)[0] ?? null,
    [startingNodeId, getSchoolsByNodeId]
  );

  // État de l'exploration
  const [exploreState, setExploreState] = useState<ExploreState>({
    currentNodeId: initialPath?.[initialPath.length - 1]?.node.id ?? startingNodeId,
    path:
      initialPath && initialPath.length > 0
        ? initialPath
        : startingNode && fallbackSchool
        ? [{ node: startingNode, school: fallbackSchool }]
        : [],
    direction: 'right'
  });

  // Stats utilisateur (mutables pour les événements)
  const [userStats, setUserStats] = useState<UserStats>(initialUserStats);

  // État des événements aléatoires
  const [currentEvent, setCurrentEvent] = useState<RandomEvent | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [pendingStep, setPendingStep] = useState<{ node: Node; school: School } | null>(null);

  // État de sélection d'établissement
  const [isSelectingSchool, setIsSelectingSchool] = useState(false);
  const [pendingNode, setPendingNode] = useState<Node | null>(null);

  // Nœud actuellement sélectionné
  const currentNode = useMemo(
    () => getNodeById(exploreState.currentNodeId ?? 0),
    [exploreState.currentNodeId, getNodeById]
  );

  // Les nœuds accessibles depuis le nœud actuel (Colonne du milieu)
  const nextPathways = useMemo(() => getNextPathways(exploreState.currentNodeId || 0), [
    exploreState.currentNodeId,
    getNextPathways
  ]);

  // Les nœuds au-delà (floutés tant que choix non fait)
  const futureOptions = useMemo(() => {
    const furtherNodes = new Set<number>();
    nextPathways.forEach((pathway) => {
      const nextNext = getNextPathways(pathway.id);
      nextNext.forEach((nn) => furtherNodes.add(nn.id));
    });
    return Array.from(furtherNodes).map((id) => getNodeById(id)).filter(Boolean) as Node[];
  }, [nextPathways, getNextPathways, getNodeById]);

  // Navigation - Sélectionner un nœud suivant
  const handleSelectPathway = useCallback((nodeId: number) => {
    const targetNode = getNodeById(nodeId);
    if (!targetNode) return;

    // Éviter les doublons dans le path
    if (exploreState.path.some((step) => step.node.id === nodeId)) {
      return; // Ne rien faire si déjà dans le path
    }

    // Forcer la sélection d'un établissement avant de valider le nœud
    setPendingNode(targetNode);
    setIsSelectingSchool(true);
  }, [exploreState.path, getNodeById]);

  // Procède à la navigation après événement (ou sans événement)
  const proceedToNode = useCallback((node: Node, school: School) => {
    setExploreState((prev) => {
      // Double check : éviter les doublons même si déjà vérifié en amont
      if (prev.path.some((step) => step.node.id === node.id)) {
        return prev; // Ne rien changer si déjà dans le path
      }
      
      return {
        currentNodeId: node.id,
        path: [...prev.path, { node, school }],
        direction: 'right'
      };
    });
  }, []);

  // Validation du nœud après sélection d'un établissement
  const handleConfirmSchool = useCallback((school: School) => {
    if (!pendingNode) return;

    const selectedNode = pendingNode;
    setIsSelectingSchool(false);
    setPendingNode(null);

    // 🎲 ROLL FOR RANDOM EVENT
    const event = rollForEvent();

    if (event) {
      // Stocker l'étape complète en attente (node + school)
      setPendingStep({ node: selectedNode, school });
      setCurrentEvent(event);
      setEventModalOpen(true);
      // La navigation sera complétée après fermeture de la modale
    } else {
      // Aucun événement, naviguer directement
      proceedToNode(selectedNode, school);
    }
  }, [pendingNode, proceedToNode]);

  // Gestion de la fermeture de la modale d'événement
  const handleEventModalClose = useCallback(() => {
    if (currentEvent && pendingStep) {
      // Appliquer les effets de l'événement sur les stats
      const newStats = applyEventEffects(userStats, currentEvent.effect);
      setUserStats(newStats);

      // Naviguer vers le nœud/établissement sélectionnés
      proceedToNode(pendingStep.node, pendingStep.school);
    }

    // Reset event state
    setEventModalOpen(false);
    setCurrentEvent(null);
    setPendingStep(null);
    setPendingNode(null);
  }, [currentEvent, pendingStep, userStats, proceedToNode]);

  // Navigation - Revenir en arrière
  const handleGoBack = useCallback(() => {
    setExploreState((prev) => {
      const newPath = prev.path.slice(0, -1);
      return {
        currentNodeId: newPath[newPath.length - 1]?.node.id || prev.currentNodeId,
        path: newPath,
        direction: 'left'
      };
    });
  }, []);

  // Layout en 3 colonnes
  const columns: (TimelineColumn & { enrichedNodes: EnrichedNode[] })[] = useMemo(
    () => [
      {
        label: 'Votre parcours',
        nodes: exploreState.path.map((step) => step.node),
        enrichedNodes: exploreState.path.map((step) => {
          const node = step.node;
          return node ? enrichNodeWithProbability(node, userStats) : null;
        }).filter((n): n is EnrichedNode => n !== null),
        isCurrent: true
      },
      {
        label: 'Vos choix possibles',
        nodes: nextPathways,
        enrichedNodes: nextPathways.map(n => enrichNodeWithProbability(n, userStats)),
        isCurrent: false
      },
      {
        label: 'Projections lointaines',
        nodes: futureOptions,
        enrichedNodes: futureOptions.map(n => enrichNodeWithProbability(n, userStats)),
        isCurrent: false
      }
    ],
    [exploreState.path, nextPathways, futureOptions, userStats]
  );

  React.useEffect(() => {
    onPathChange?.(exploreState.path);
    
    // OPTIMISATION: Nettoyer les données inutilisées à chaque étape
    if (exploreState.path.length > 1) {
      const pathIds = exploreState.path.map(step => step.node.id);
      pruneUnusedData(pathIds, exploreState.currentNodeId);
    }
  }, [exploreState.path, exploreState.currentNodeId, onPathChange, pruneUnusedData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-[#E2E8F0] to-[#F8F9FA] dark:from-[#121212] dark:via-[#27272A] dark:to-[#121212] text-gray-900 dark:text-[#F3F4F6] overflow-hidden transition-colors duration-200">
      {/* HEADER */}
      <motion.header
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#27272A]/95 backdrop-blur-lg border-b border-[#E2E8F0] dark:border-[#27272A] px-4 md:px-6 py-3 md:py-4 transition-colors"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F3F4F6]">AkJol Simulator</h1>
            <p className="text-gray-700 dark:text-gray-300 text-xs md:text-sm">Explorez votre chemin d'orientation</p>
          </motion.div>

          {/* Breadcrumb / Path indicator */}
          <div className="flex items-center gap-2 text-xs md:text-sm overflow-x-auto max-w-full pb-2 md:pb-0">
            <AnimatePresence mode="popLayout">
              {exploreState.path.map((step, idx) => {
                return (
                  <React.Fragment key={`${step?.node.id}-${step?.school.id}-${idx}`}>
                    <motion.span
                      className="text-gray-700 dark:text-gray-300 truncate whitespace-nowrap flex-shrink-0"
                      initial={{ opacity: 0, x: exploreState.direction === 'right' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: exploreState.direction === 'right' ? -20 : 20 }}
                      transition={{ duration: 0.15 }}
                    >
                      {step?.node.title} · {step?.school.name}
                    </motion.span>
                    {idx < exploreState.path.length - 1 && <span className="text-gray-500 dark:text-gray-600 flex-shrink-0">→</span>}
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* MAIN TIMELINE - Responsive Layout */}
      <main className="px-3 md:px-6 py-4 md:py-8 pb-20 md:pb-8">
        {/* Desktop: 3 colonnes */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 lg:gap-8 min-h-[calc(100vh-200px)]">
          {columns.map((column, colIdx) => (
            <motion.div
              key={column.label}
              className="flex flex-col"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: colIdx * 0.05 }}
            >
              {/* Column Header */}
              <motion.div className="mb-4 md:mb-6" whileInView={{ x: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <h2 className="text-base md:text-xl font-bold mb-2">{column.label}</h2>
                <motion.div
                  className="h-1 w-20 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 + colIdx * 0.05 }}
                />
              </motion.div>

              {/* Cards Container */}
              <div className="flex flex-col gap-3 md:gap-4 flex-1">
                {column.nodes.length === 0 ? (
                  <motion.div
                    className="text-center py-12 text-gray-600 dark:text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-xs md:text-sm">{column.isCurrent ? 'Commencez votre exploration' : 'Sélectionnez un chemin'}</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {column.enrichedNodes.map((node, idx) => {
                      const selectedSchool = colIdx === 0 ? exploreState.path[idx]?.school : null;
                      return (
                      <motion.div
                        key={`${node.id}-${idx}`}
                        className={colIdx === 2 ? 'opacity-50 pointer-events-none' : ''}
                        onClick={() => colIdx === 1 && handleSelectPathway(node.id)}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <NodeCard
                          node={node}
                          isActive={node.id === currentNode?.id}
                          onClick={colIdx === 1 ? () => handleSelectPathway(node.id) : undefined}
                          variant={colIdx === 0 ? 'compact' : 'expanded'}
                          showArrow={colIdx !== 2}
                          animationDelay={idx}
                          successProbability={node.successProbability}
                          riskLevel={node.riskLevel}
                        />
                        {selectedSchool && (
                          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 px-1">
                            Établissement : <span className="text-gray-900 dark:text-gray-300">{selectedSchool.name} ({selectedSchool.city})</span>
                          </p>
                        )}
                      </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tablet & Mobile: 1 colonne avec tabs/carousel */}
        <div className="lg:hidden">
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {columns.map((column, colIdx) => (
              <motion.div
                key={column.label}
                className="flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: colIdx * 0.1 }}
              >
                {/* Column Header */}
                <div className="mb-4">
                  <h2 className="text-lg md:text-xl font-bold mb-2">{column.label}</h2>
                  <motion.div
                    className="h-1 w-20 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 + colIdx * 0.1 }}
                  />
                </div>

                {/* Cards Container - Scroll horizontal sur mobile */}
                {column.nodes.length === 0 ? (
                  <motion.div
                    className="text-center py-12 text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm">{column.isCurrent ? 'Commencez votre exploration' : 'Sélectionnez un chemin'}</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
                    <AnimatePresence mode="popLayout">
                      {column.enrichedNodes.map((node, idx) => {
                        const selectedSchool = colIdx === 0 ? exploreState.path[idx]?.school : null;
                        return (
                        <motion.div
                          key={`${node.id}-${idx}`}
                          className={colIdx === 2 ? 'opacity-50 pointer-events-none' : ''}
                          onClick={() => colIdx === 1 && handleSelectPathway(node.id)}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.9 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                        >
                          <NodeCard
                            node={node}
                            isActive={node.id === currentNode?.id}
                            onClick={colIdx === 1 ? () => handleSelectPathway(node.id) : undefined}
                            variant="compact"
                            showArrow={colIdx !== 2}
                            animationDelay={idx}
                            successProbability={node.successProbability}
                            riskLevel={node.riskLevel}
                          />
                          {selectedSchool && (
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 px-1">
                              Établissement : <span className="text-gray-900 dark:text-[#F3F4F6]">{selectedSchool.name} ({selectedSchool.city})</span>
                            </p>
                          )}
                        </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Navigation buttons */}
        <motion.div
          className="mt-8 md:mt-12 flex flex-col md:flex-row justify-center items-center gap-3 md:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.button
            onClick={handleGoBack}
            disabled={exploreState.path.length <= 1}
            whileHover={{ scale: exploreState.path.length > 1 ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed px-4 md:px-6 py-2 md:py-3 bg-[#E2E8F0] dark:bg-[#27272A] hover:bg-[#CBD5E1] dark:hover:bg-[#3F3F46] rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm md:text-base text-gray-900 dark:text-[#F3F4F6]"
          >
            <ChevronLeft size={18} /> Retour
          </motion.button>

          {currentNode && onShowFormationDetails && (
            <motion.button
              onClick={() => onShowFormationDetails(currentNode.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6] rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm md:text-base text-[#8B5CF6]"
            >
              📚 Voir détails formation
            </motion.button>
          )}

          <motion.div className="text-gray-600 dark:text-gray-400 text-sm md:text-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {exploreState.path.length} étape(s)
          </motion.div>
        </motion.div>
      </main>

      {/* BREAKING NEWS MODAL */}
      {currentEvent && (
        <BreakingNewsModal
          isOpen={eventModalOpen}
          event={currentEvent}
          onClose={handleEventModalClose}
        />
      )}

      <SchoolSelector
        isOpen={isSelectingSchool}
        node={pendingNode}
        schools={pendingNode ? (() => {
          const availableSchools = getSchoolsByNodeId(pendingNode.id);
          // Si aucune école n'est disponible, créer une école générique
          if (availableSchools.length === 0) {
            return [{
              id: 999999,
              name: 'Établissement générique',
              city: 'France',
              node_id: pendingNode.id,
              rating: 3.5
            }];
          }
          return availableSchools;
        })() : []}
        onSelectSchool={handleConfirmSchool}
        onClose={() => {
          setIsSelectingSchool(false);
          setPendingNode(null);
        }}
      />
    </div>
  );
};

export default ExploreTimeline;
