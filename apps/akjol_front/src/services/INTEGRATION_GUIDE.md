/**
 * GUIDE D'INTÉGRATION - REFACTORISATION DES DONNÉES
 * 
 * Ce fichier explique comment intégrer le nouveau système de données dynamiques
 * dans votre code existant
 */

// ============================================================================
// 📌 ÉTAPE 1: Modifier le hook useAkJolApp.ts
// ============================================================================

/*
AVANT (avec import statique des données mockées):
─────────────────────────────────────────────────

import { NODES, EDGES, SCHOOLS } from '../data/mockData';

export function useAkJolApp() {
  const [nodes, setNodes] = useState<Node[]>(NODES);
  const [schools, setSchools] = useState<School[]>(SCHOOLS);
  const [edges, setEdges] = useState<Edge[]>(EDGES);
  
  // ...
}


APRÈS (avec chargement dynamique depuis les APIs):
─────────────────────────────────────────────────

import { loadDataFromAPIs, generateEdgesFromNodes } from '../services/dataService';
import { EDGES as MOCK_EDGES } from '../data/mockData'; // ✅ Garder EDGES mockés

export function useAkJolApp() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Charger les données dynamiques depuis les APIs
        const { nodes: apiNodes, schools: apiSchools } = 
          await loadDataFromAPIs();
        
        setNodes(apiNodes);
        setSchools(apiSchools);
        
        // 2. GARDER les EDGES mockées pour l'instant
        //    (ou générer automatiquement si désiré)
        setEdges(MOCK_EDGES);
        
        // Alternative: générer automatiquement les edges
        // const generatedEdges = generateEdgesFromNodes(apiNodes);
        // setEdges(generatedEdges);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
        
        // ⚠️ FALLBACK: charger les données mockées en cas d'erreur
        setNodes(MOCK_NODES);
        setSchools(MOCK_SCHOOLS);
        setEdges(MOCK_EDGES);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []); // Lance une seule fois au mount

  return {
    nodes,
    schools,
    edges,
    isLoading,
    error
  };
}
*/

// ============================================================================
// 📌 ÉTAPE 2: Modifier App.tsx pour afficher l'état de chargement
// ============================================================================

/*
AVANT:
─────
function App() {
  const { nodes, schools, edges } = useAkJolApp();
  
  return (
    <div>
      <ExploreTimeline nodes={nodes} schools={schools} edges={edges} />
    </div>
  );
}


APRÈS:
──────
function App() {
  const { nodes, schools, edges, isLoading, error } = useAkJolApp();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin text-4xl">🔄</div>
          <p className="mt-4 text-lg font-medium text-gray-600">
            Chargement des données...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            (depuis les APIs ONISEP)
          </p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center">
          <div className="text-4xl">⚠️</div>
          <p className="mt-4 text-lg font-medium text-red-600">
            Erreur lors du chargement
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <ExploreTimeline nodes={nodes} schools={schools} edges={edges} />
    </div>
  );
}
*/

// ============================================================================
// 📌 ÉTAPE 3: Options pour adapter les données (facultatif)
// ============================================================================

/*
Option A: PAGINATION
───────────────────
Si vous avez trop de données, paginer le chargement:

const [page, setPage] = useState(1);
const PAGE_SIZE = 50;

const { nodes: allNodes, schools: allSchools } = await loadDataFromAPIs();
const paginatedNodes = allNodes.slice(0, page * PAGE_SIZE);


Option B: FILTRAGE
──────────────────
Si vous voulez charger que certains types:

const { nodes: allNodes, schools: allSchools } = await loadDataFromAPIs();
const filteredNodes = allNodes.filter(n => 
  ['ETUDE_SUP', 'METIER'].includes(n.type)
);


Option C: GÉNÉRATION D'EDGES AUTOMATIQUE
─────────────────────────────────────────
Remplacer les edges mockées par des edges générées intelligemment:

const { nodes: apiNodes } = await loadDataFromAPIs();
const edges = generateEdgesFromNodes(apiNodes);
setEdges(edges);
*/

// ============================================================================
// 📌 ÉTAPE 4: Checker que vos composants utilisent les bonnes interfaces
// ============================================================================

/*
Vérifier que vos composants acceptent bien:

✅ Node[] (pas custom types)
✅ School[] (pa custom types)
✅ Edge[] (pass custom types)

Si certains composants utilisent des types différents,
adapter les avec du mapping simple.
*/

// ============================================================================
// 📌 RÉSUMÉ DE MIGRATION
// ============================================================================

/*
1. ✅ Garder mockData.ts intact (fallback en cas d'erreur)
2. ✅ Créer apiService.ts (fetch brut)
3. ✅ Créer dataMapper.ts (transformation)
4. ✅ Créer dataService.ts (orchestration)
5. ✅ Modifier useAkJolApp.ts (ajout useEffect + loading)
6. ✅ Modifier App.tsx (afficher loader et erreur)
7. ✅ Garder EDGES mockées pour l'instant

Résultat:
         Au démarrage → useEffect lance loadDataFromAPIs()
                     → Chargement depuis les 2 URLs ONISEP
                     → Mapping en Node/School
                     → Cache de 1h par défaut
                     → Fallback mockData si erreur
*/

export {};
