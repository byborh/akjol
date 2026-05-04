/**
 * src/services/dataService.ts
 * 
 * Service d'orchestre qui combine:
 * - Fetch des APIs (apiService)
 * - Mapping des données (dataMapper)
 * - Gestion du cache local
 */

import { 
  fetchAllDataFromAPIs 
} from './apiService';
import { 
  mapRawFormationToNode, 
  mapRawEtablissementToSchool 
} from './dataMapper';
import type { Node, School, Edge } from '../types';

/**
 * Cache en mémoire pour éviter les appels répétés
 */
let cachedNodes: Node[] | null = null;
let cachedSchools: School[] | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 heure
let cacheTimestamp = 0;

/**
 * Charge les données (formations + établissements) depuis les APIs
 * ou depuis le cache si disponible et valide
 * 
 * @returns Promise<{ nodes: Node[], schools: School[] }>
 */
export async function loadDataFromAPIs(): Promise<{
  nodes: Node[];
  schools: School[];
}> {
  // Vérifier le cache
  const now = Date.now();
  if (
    cachedNodes && 
    cachedSchools && 
    now - cacheTimestamp < CACHE_DURATION
  ) {
    console.log('📦 Données servies depuis le cache');
    return {
      nodes: cachedNodes,
      schools: cachedSchools,
    };
  }

  try {
    console.log('🔄 Récupération des données depuis les APIs ONISEP...');
    
    // Fetch parallélisé
    const { formations, etablissements } = await fetchAllDataFromAPIs();

    // Échantillonnage intelligent pour performances
    // On prend un échantillon diversifié plutôt que tout charger
    const sampleFormations = sampleDiverseFormations(formations, 800);
    const sampleEtablissements = etablissements.slice(0, 2000);

    // Mapper les formations échantillonnées en Nodes
    const nodes = sampleFormations.map((raw, index) => mapRawFormationToNode(raw, index + 1));

    if (nodes.length === 0) {
      throw new Error('Aucune formation récupérée depuis l\'API ONISEP');
    }

    // Mapper les établissements en Schools
    // Associer chaque école à une formation (relation 1-to-N)
    const schools = sampleEtablissements.map((raw, index) => {
      const nodeId = (index % nodes.length) + 1; // Distribuer sur les formations
      return mapRawEtablissementToSchool(raw, index + 1, nodeId);
    });

    // Sauvegarder en cache
    cachedNodes = nodes;
    cachedSchools = schools;
    cacheTimestamp = now;

    console.log(`✅ ${nodes.length} formations et ${schools.length} établissements chargés`);

    return { nodes, schools };
  } catch (error) {
    console.error('❌ Erreur lors du chargement des APIs:', error);
    throw error;
  }
}

/**
 * Échantillonne les formations de manière diversifiée
 * Prend un mix de différents types pour avoir une représentation équilibrée
 */
function sampleDiverseFormations(formations: any[], maxCount: number): any[] {
  // Grouper par type pour échantillonner de manière équilibrée
  const byType: Record<string, any[]> = {};
  
  formations.forEach(f => {
    const type = String(f.libelle_type_formation || 'Autre');
    if (!byType[type]) byType[type] = [];
    byType[type].push(f);
  });

  // Calculer combien prendre de chaque type
  const types = Object.keys(byType);
  const perType = Math.ceil(maxCount / types.length);

  // Prendre un échantillon de chaque type
  const sampled: any[] = [];
  types.forEach(type => {
    const items = byType[type];
    // Prendre régulièrement espacé pour diversité
    const step = Math.max(1, Math.floor(items.length / perType));
    for (let i = 0; i < items.length && sampled.length < maxCount; i += step) {
      sampled.push(items[i]);
    }
  });

  return sampled.slice(0, maxCount);
}

/**
 * Invalide le cache (utile pour forcer un refresh)
 */
export function invalidateCache(): void {
  cachedNodes = null;
  cachedSchools = null;
  cacheTimestamp = 0;
  console.log('🗑️  Cache invalidé');
}

/**
 * Recharge les données depuis les APIs (sans cache)
 */
export async function reloadDataFromAPIs(): Promise<{
  nodes: Node[];
  schools: School[];
}> {
  invalidateCache();
  return loadDataFromAPIs();
}

/**
 * Récupère juste les nœuds
 */
export async function getNodes(): Promise<Node[]> {
  const { nodes } = await loadDataFromAPIs();
  return nodes;
}

/**
 * Récupère juste les écoles
 */
export async function getSchools(): Promise<School[]> {
  const { schools } = await loadDataFromAPIs();
  return schools;
}

/**
 * Crée des EDGES (arêtes du graphe) de manière intelligente ET OPTIMISÉE
 * 
 * Logique OPTIMISÉE pour performances:
 * - Limite stricte du nombre de connexions par nœud
 * - Évite les boucles imbriquées massives
 * 
 * @param nodes - Array de nœuds
 * @returns Edge[] - Arêtes générées (limitées pour performances)
 */
export function generateEdgesFromNodes(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  let edgeId = 1;

  // Créer une carte par type
  const nodesByType = {
    BAC: nodes.filter(n => n.type === 'BAC'),
    ETUDE_SUP: nodes.filter(n => n.type === 'ETUDE_SUP'),
    METIER: nodes.filter(n => n.type === 'METIER'),
    CERTIF: nodes.filter(n => n.type === 'CERTIF'),
  };

  // Helper: trouve les domaines d'un nœud (version optimisée)
  const getDomains = (node: Node): string[] => {
    const domains: string[] = [];
    
    if (node.metadata?.domaine) {
      domains.push(String(node.metadata.domaine).toLowerCase());
    }
    
    const text = node.title.toLowerCase();
    if (text.includes('science')) domains.push('sciences');
    if (text.includes('littéraire')) domains.push('lettres');
    if (text.includes('économ')) domains.push('economie');
    if (text.includes('techno')) domains.push('technologie');
    if (text.includes('pro')) domains.push('professionnel');
    if (text.includes('art')) domains.push('arts');
    if (text.includes('informatique')) domains.push('informatique');
    
    return domains.length > 0 ? domains : ['general'];
  };

  // Helper: calcule compatibilité entre domaines
  const domainsMatch = (domains1: string[], domains2: string[]): boolean => {
    if (domains1.includes('general') || domains2.includes('general')) return true;
    return domains1.some(d1 => domains2.includes(d1));
  };

  // BAC → ETUDE_SUP (LIMITE STRICTE: seulement les premiers BAC)
  const limitedBAC = nodesByType.BAC.slice(0, Math.min(200, nodesByType.BAC.length));
  limitedBAC.forEach(bac => {
    const bacDomains = getDomains(bac);
    let added = 0;
    
    // Chercher jusqu'à 5 ETUDE_SUP compatibles maximum
    for (const etude of nodesByType.ETUDE_SUP) {
      if (added >= 5) break;
      if (domainsMatch(bacDomains, getDomains(etude))) {
        edges.push({
          id: edgeId++,
          source_id: bac.id,
          target_id: etude.id,
          requirements: { difficulty: 'Medium', average: 10 },
        });
        added++;
      }
    }
    
    // Fallback: connecter à au moins 2 ETUDE_SUP
    if (added === 0) {
      nodesByType.ETUDE_SUP.slice(0, 2).forEach(etude => {
        edges.push({
          id: edgeId++,
          source_id: bac.id,
          target_id: etude.id,
          requirements: { difficulty: 'Medium', average: 10 },
        });
      });
    }
  });

  // ETUDE_SUP → METIER (LIMITE STRICTE: premiers ETUDE_SUP)
  const limitedETUDE = nodesByType.ETUDE_SUP.slice(0, Math.min(300, nodesByType.ETUDE_SUP.length));
  limitedETUDE.forEach(etude => {
    const etudeDomains = getDomains(etude);
    let added = 0;
    
    // Chercher jusqu'à 3 métiers compatibles
    for (const metier of nodesByType.METIER) {
      if (added >= 3) break;
      if (domainsMatch(etudeDomains, getDomains(metier))) {
        edges.push({
          id: edgeId++,
          source_id: etude.id,
          target_id: metier.id,
          requirements: { difficulty: 'Hard', average: 12 },
        });
        added++;
      }
    }
    
    // Fallback
    if (added === 0 && nodesByType.METIER.length > 0) {
      edges.push({
        id: edgeId++,
        source_id: etude.id,
        target_id: nodesByType.METIER[0].id,
        requirements: { difficulty: 'Hard', average: 12 },
      });
    }
  });

  // ETUDE_SUP → CERTIF (limité aux premiers)
  nodesByType.ETUDE_SUP.slice(0, 100).forEach(etude => {
    nodesByType.CERTIF.slice(0, 1).forEach(certif => {
      edges.push({
        id: edgeId++,
        source_id: etude.id,
        target_id: certif.id,
        requirements: { difficulty: 'Easy', average: 8 },
      });
    });
  });

  // BAC Pro → METIER direct (très limité)
  nodesByType.BAC
    .filter(bac => getDomains(bac).includes('professionnel'))
    .slice(0, 50)
    .forEach(bacPro => {
      const bacDomains = getDomains(bacPro);
      let added = 0;
      
      for (const metier of nodesByType.METIER) {
        if (added >= 2) break;
        if (domainsMatch(bacDomains, getDomains(metier))) {
          edges.push({
            id: edgeId++,
            source_id: bacPro.id,
            target_id: metier.id,
            requirements: { difficulty: 'Medium', average: 10 },
          });
          added++;
        }
      }
    });

  console.log(`🔗 ${edges.length} connexions générées entre ${nodes.length} nœuds (optimisé)`);
  console.log(`   - ${nodesByType.BAC.length} BAC`);
  console.log(`   - ${nodesByType.ETUDE_SUP.length} ETUDE_SUP`);
  console.log(`   - ${nodesByType.METIER.length} METIER`);
  console.log(`   - ${nodesByType.CERTIF.length} CERTIF`);
  
  return edges;
}
