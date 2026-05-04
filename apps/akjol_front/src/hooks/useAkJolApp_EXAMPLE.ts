/**
 * EXEMPLE COMPLET: useAkJolApp.ts modifié
 * 
 * Veuillez adapter ce code à votre hook existant
 * Ce fichier est une démonstration - copier/adapter le code pertinent
 */

import { useState, useEffect } from 'react';
import type { Node, School, Edge, ExploreState } from '../types';
import { loadDataFromAPIs, generateEdgesFromNodes } from '../services/dataService';
// import { NODES, SCHOOLS, EDGES } from '../data/mockData'; // ⚠️ Garder en import pour fallback

/**
 * Hook principal de l'application AkJol
 * 
 * Récupère les nodes (formations), schools (établissements), et edges (connexions)
 * depuis les APIs ONISEP avec fallback sur les données mockées
 */
export function useAkJolApp() {
  // ❌ État des données
  const [nodes, setNodes] = useState<Node[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // 🔄 État du chargement
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 🎲 État de l'exploration
  const [exploreState, setExploreState] = useState<ExploreState>({
    currentNodeId: null,
    path: [],
    direction: 'right',
  });

  /**
   * ⚡ Initialisation au montage du composant
   */
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('📡 Démarrage du chargement des données ONISEP...');

        // 1️⃣ Charger les données depuis les APIs
        const { nodes: apiNodes, schools: apiSchools } = 
          await loadDataFromAPIs();

        // Vérifier qu'on a au moins quelques données
        if (apiNodes.length === 0) {
          throw new Error('Aucune formation récupérée depuis l\'API');
        }

        setNodes(apiNodes);
        setSchools(apiSchools);

        // 2️⃣ Gérer les EDGES
        // Option 1: Utiliser les edges mockées (pour l'instant)
        // const { EDGES } = await import('../data/mockData');
        // setEdges(EDGES);

        // Option 2: Générer automatiquement les edges
        const generatedEdges = generateEdgesFromNodes(apiNodes);
        setEdges(generatedEdges);

        console.log(`✅ ${apiNodes.length} formations chargées`);
        console.log(`✅ ${apiSchools.length} établissements chargés`);

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        console.error('❌ Erreur lors du chargement:', error);
        setError(error);

        // ⚠️ FALLBACK: Charger les données mockées en cas d'erreur
        try {
          console.log('🔄 Chargement du fallback (données mockées)...');
          const { NODES, SCHOOLS, EDGES } = await import('../data/mockData');
          setNodes(NODES);
          setSchools(SCHOOLS);
          setEdges(EDGES);
          setError(null); // Nettoyer l'erreur si le fallback réussit
        } catch (fallbackErr) {
          console.error('❌ Fallback échoué aussi:', fallbackErr);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Lance une seule fois au montage
    initializeData();
  }, []);

  /**
   * Navigue vers un nœud spécifique
   */
  const navigateToNode = (nodeId: number, direction: 'left' | 'right' = 'right') => {
    setExploreState(prev => ({
      ...prev,
      currentNodeId: nodeId,
      direction,
    }));
  };

  /**
   * Valide une étape (node + school)
   */
  const validateStep = (node: Node, school: School) => {
    setExploreState(prev => ({
      ...prev,
      path: [
        ...prev.path,
        { node, school },
      ],
    }));
  };

  /**
   * Annule la dernière étape
   */
  const undoStep = () => {
    setExploreState(prev => ({
      ...prev,
      path: prev.path.slice(0, -1),
      currentNodeId: prev.path.length > 0 
        ? prev.path[prev.path.length - 2].node.id 
        : null,
    }));
  };

  /**
   * Réinitialise l'exploration
   */
  const resetExploration = () => {
    setExploreState({
      currentNodeId: null,
      path: [],
      direction: 'right',
    });
  };

  /**
   * Obtient les nœuds connectés à un nœud donné
   */
  const getConnectedNodes = (nodeId: number): Node[] => {
    const connectedIds = edges
      .filter(edge => edge.source_id === nodeId)
      .map(edge => edge.target_id);

    return nodes.filter(node => connectedIds.includes(node.id));
  };

  /**
   * Obtient les écoles pour une formation donnée
   */
  const getSchoolsForNode = (nodeId: number): School[] => {
    return schools.filter(school => school.node_id === nodeId);
  };

  return {
    // 📊 Données
    nodes,
    schools,
    edges,

    // 🔄 État de chargement
    isLoading,
    error,

    // 🎲 État de l'exploration
    exploreState,

    // 🎮 Méthodes de navigation
    navigateToNode,
    validateStep,
    undoStep,
    resetExploration,

    // 🔍 Requêtes
    getConnectedNodes,
    getSchoolsForNode,
  };
}

export type UseAkJolAppReturn = ReturnType<typeof useAkJolApp>;
