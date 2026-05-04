"use client";

/**
 * src/contexts/DataContext.tsx
 *
 * Contexte pour fournir les données (NODES, SCHOOLS, EDGES) à toute l'application
 * Remplace les imports statiques de mockData
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Node, School, Edge } from '../types';
import { loadDataFromAPIs, generateEdgesFromNodes } from '../services/dataService';

interface DataContextType {
  nodes: Node[];
  schools: School[];
  edges: Edge[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  getSchoolsByNodeId: (nodeId: number) => School[];
  getNextPathways: (nodeId: number) => Node[];
  getNodeById: (id: number) => Node | undefined;
  pruneUnusedData: (currentPath: number[], currentNodeId: number) => void;
  loadMoreData: () => Promise<void>;
  loadAllDataForSearch: () => void;
  resetToInitialData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  // Cache global pour éviter de recharger à chaque nouvelle vie
  const [dataCache, setDataCache] = useState<{
    allNodes: Node[];
    allSchools: School[];
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Si les données sont déjà en cache, charger les 50 premières
        if (dataCache) {
          console.log('📦 Utilisation du cache (pas de rechargement API)');
          const initialNodes = dataCache.allNodes.slice(0, 50);
          const initialSchools = dataCache.allSchools.slice(0, 150);
          
          setNodes(initialNodes);
          setSchools(initialSchools);
          setEdges(generateEdgesFromNodes(initialNodes));
          setLoadedCount(50);
          setHasMore(dataCache.allNodes.length > 50);
          setIsLoading(false);
          return;
        }

        console.log('📡 Chargement initial (50 premières formations)...');

        // Charger les données depuis les APIs (une seule fois)
        const { nodes: apiNodes, schools: apiSchools } = await loadDataFromAPIs();

        if (!mounted) return;

        if (apiNodes.length === 0) {
          throw new Error('Aucune formation récupérée depuis l\'API');
        }

        // Mettre en cache TOUTES les données
        setDataCache({
          allNodes: apiNodes,
          allSchools: apiSchools
        });

        // Afficher seulement les 50 premières
        const initialNodes = apiNodes.slice(0, 50);
        const initialSchools = apiSchools.slice(0, 150);

        setNodes(initialNodes);
        setSchools(initialSchools);
        setEdges(generateEdgesFromNodes(initialNodes));
        setLoadedCount(50);
        setHasMore(apiNodes.length > 50);

        console.log(`✅ ${initialNodes.length}/\${apiNodes.length} formations affichées`);
        console.log(`✅ ${initialSchools.length}/\${apiSchools.length} établissements affichés`);
        console.log(`💡 Cliquer sur "Charger plus" pour voir les autres formations`);

      } catch (err) {
        if (!mounted) return;

        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        console.error('❌ Erreur lors du chargement:', error);
        setError(error);

        // Fallback: charger les données mockées
        try {
          console.log('🔄 Chargement du fallback (données mockées)...');
          const { NODES, SCHOOLS, EDGES } = await import('../data/mockData');
          
          if (!mounted) return;
          
          setNodes(NODES.slice(0, 50));
          setSchools(SCHOOLS.slice(0, 150));
          setEdges(EDGES);
          setDataCache({ allNodes: NODES, allSchools: SCHOOLS });
          setLoadedCount(50);
          setHasMore(NODES.length > 50);
          setError(null);
          
          console.log('✅ Fallback chargé avec succès');
        } catch (fallbackErr) {
          console.error('❌ Fallback échoué:', fallbackErr);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, []); // Pas de dépendance = chargement une seule fois !

  // Fonction helper: obtenir les écoles d'une formation
  const getSchoolsByNodeId = (nodeId: number): School[] => {
    return schools.filter(school => school.node_id === nodeId);
  };

  // Fonction helper: obtenir les nœuds suivants
  const getNextPathways = (nodeId: number): Node[] => {
    const connectedEdges = edges.filter(edge => edge.source_id === nodeId);
    return connectedEdges
      .map(edge => nodes.find(n => n.id === edge.target_id))
      .filter((node): node is Node => node !== undefined);
  };

  // Fonction helper: obtenir un nœud par ID
  const getNodeById = (id: number): Node | undefined => {
    return nodes.find(n => n.id === id);
  };

  /**
   * Charge progressivement 50 formations supplémentaires depuis le cache
   */
  const loadMoreData = async () => {
    if (!dataCache || !hasMore) {
      console.log('⚠️  Pas de données supplémentaires à charger');
      return;
    }

    console.log(`📦 Chargement de 50 formations supplémentaires (${loadedCount} → ${loadedCount + 50})...`);

    // Charger les 50 formations suivantes
    const nextBatch = dataCache.allNodes.slice(loadedCount, loadedCount + 50);
    const updatedNodes = [...nodes, ...nextBatch];

    // Charger quelques établissements supplémentaires (ratio 3:1)
    const nextSchools = dataCache.allSchools.slice(
      Math.floor(loadedCount * 1.5), 
      Math.floor((loadedCount + 50) * 1.5)
    );
    const updatedSchools = [...schools, ...nextSchools];

    // Régénérer les edges pour inclure les nouvelles formations
    const updatedEdges = generateEdgesFromNodes(updatedNodes);

    setNodes(updatedNodes);
    setSchools(updatedSchools);
    setEdges(updatedEdges);
    setLoadedCount(prev => prev + 50);
    setHasMore(loadedCount + 50 < dataCache.allNodes.length);

    console.log(`✅ ${updatedNodes.length}/${dataCache.allNodes.length} formations affichées`);
  };

  /**
   * Charge TOUTES les formations du cache pour permettre une recherche exhaustive
   */
  const loadAllDataForSearch = () => {
    if (!dataCache) {
      console.log('⚠️  Pas de données en cache');
      return;
    }

    console.log(`🔍 Chargement de TOUTES les formations pour la recherche (${dataCache.allNodes.length} formations)...`);

    setNodes(dataCache.allNodes);
    setSchools(dataCache.allSchools);
    setEdges(generateEdgesFromNodes(dataCache.allNodes));
    setLoadedCount(dataCache.allNodes.length);
    setHasMore(false);

    console.log(`✅ ${dataCache.allNodes.length} formations chargées pour recherche exhaustive`);
  };

  /**
   * Réinitialise les données aux 50 premières formations depuis le cache
   * Utilisé quand on fait "Nouvelle vie" pour retrouver l'affichage initial
   */
  const resetToInitialData = () => {
    if (!dataCache) {
      console.log('⚠️  Pas de données en cache pour réinitialiser');
      return;
    }

    console.log('🔄 Réinitialisation aux 50 premières formations...');

    const initialNodes = dataCache.allNodes.slice(0, 50);
    const initialSchools = dataCache.allSchools.slice(0, 150);

    setNodes(initialNodes);
    setSchools(initialSchools);
    setEdges(generateEdgesFromNodes(initialNodes));
    setLoadedCount(50);
    setHasMore(dataCache.allNodes.length > 50);

    console.log(`✅ Réinitialisation terminée: ${initialNodes.length}/${dataCache.allNodes.length} formations affichées`);
  };

  /**
   * OPTIMISATION: Nettoie les données inutilisées pour libérer de la mémoire
   * Garde uniquement:
   * - Les nœuds du parcours actuel
   * - Le nœud actuel
   * - Les nœuds accessibles depuis le nœud actuel
   * - Les nœuds accessibles depuis les nœuds accessibles (horizon +2)
   */
  const pruneUnusedData = (currentPath: number[], currentNodeId: number) => {
    // Calculer les IDs à conserver
    const keepIds = new Set<number>();
    
    // 1. Conserver le parcours actuel
    currentPath.forEach(id => keepIds.add(id));
    
    // 2. Conserver le nœud actuel
    keepIds.add(currentNodeId);
    
    // 3. Conserver les nœuds accessibles depuis le nœud actuel (prochains choix)
    const nextIds = edges
      .filter(edge => edge.source_id === currentNodeId)
      .map(edge => edge.target_id);
    nextIds.forEach(id => keepIds.add(id));
    
    // 4. Conserver les nœuds accessibles depuis les prochains choix (horizon +2)
    nextIds.forEach(nextId => {
      const futureIds = edges
        .filter(edge => edge.source_id === nextId)
        .map(edge => edge.target_id);
      futureIds.forEach(id => keepIds.add(id));
    });
    
    // Filtrer les nœuds
    const prunedNodes = nodes.filter(node => keepIds.has(node.id));
    
    // Filtrer les écoles (garder uniquement celles liées aux nœuds conservés)
    const prunedSchools = schools.filter(school => keepIds.has(school.node_id));
    
    // Filtrer les edges (garder uniquement ceux entre nœuds conservés)
    const prunedEdges = edges.filter(
      edge => keepIds.has(edge.source_id) && keepIds.has(edge.target_id)
    );
    
    // Mettre à jour les states
    const removedNodes = nodes.length - prunedNodes.length;
    const removedSchools = schools.length - prunedSchools.length;
    const removedEdges = edges.length - prunedEdges.length;
    
    if (removedNodes > 0 || removedSchools > 0 || removedEdges > 0) {
      console.log(`🗑️  Nettoyage des données inutilisées:`);
      console.log(`   - ${removedNodes} formations supprimées`);
      console.log(`   - ${removedSchools} établissements supprimés`);
      console.log(`   - ${removedEdges} connexions supprimées`);
      console.log(`   ✅ Mémoire libérée!`);
      
      setNodes(prunedNodes);
      setSchools(prunedSchools);
      setEdges(prunedEdges);
    }
  };

  const value: DataContextType = {
    nodes,
    schools,
    edges,
    isLoading,
    error,
    hasMore,
    loadMoreData,
    loadAllDataForSearch,
    resetToInitialData,
    getSchoolsByNodeId,
    getNextPathways,
    getNodeById,
    pruneUnusedData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
