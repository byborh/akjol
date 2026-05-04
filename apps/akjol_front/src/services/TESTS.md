/**
 * 🧪 TESTS RAPIDES - Vérifiez que la refactorisation fonctionne
 * 
 * Exécutez ces tests dans la console du navigateur (F12)
 */

/*
═══════════════════════════════════════════════════════════════════════════
✅ TEST 1 : Les APIs sont accessibles
═══════════════════════════════════════════════════════════════════════════

Copiez ceci dans la console:

fetch('https://api.opendata.onisep.fr/downloads/5fa591127f501/5fa591127f501.json')
  .then(r => r.json())
  .then(data => console.log('✅ API Formations OK:', data.length))
  .catch(e => console.error('❌ API Formations KO:', e));

fetch('https://api.opendata.onisep.fr/downloads/5fa586da5c4b6/5fa586da5c4b6.json')
  .then(r => r.json())
  .then(data => console.log('✅ API Établissements OK:', data.length))
  .catch(e => console.error('❌ API Établissements KO:', e));

Résultat attendu:
  ✅ API Formations OK: 10000+
  ✅ API Établissements OK: 5000+


═══════════════════════════════════════════════════════════════════════════
✅ TEST 2 : Les imports fonctionnent
═══════════════════════════════════════════════════════════════════════════

Vérifiez dans l'IDE que les imports ne montrent pas d'erreur:

✅ import { fetchFormationsFromAPI } from './services/apiService';
✅ import { mapRawFormationToNode } from './services/dataMapper';
✅ import { loadDataFromAPIs } from './services/dataService';

Pas d'erreur TypeScript? Bon signe!


═══════════════════════════════════════════════════════════════════════════
✅ TEST 3 : Vérifier les logs au démarrage
═══════════════════════════════════════════════════════════════════════════

Démarrer l'app (npm run dev) et ouvrir F12 → Console

Vous DEVEZ voir:
  📡 Démarrage du chargement des données ONISEP...
  ✅ 100 formations chargées
  ✅ 300 établissements chargés
  🔗 1250 connexions générées entre nœuds

Si vous voyez "📦 Données servies depuis le cache" au reload, c'est que
le cache local fonctionne. Excellent!


═══════════════════════════════════════════════════════════════════════════
✅ TEST 4 : Vérifier la structure des données
═══════════════════════════════════════════════════════════════════════════

Ajoutez ce code dans useAkJolApp.ts après le setNodes/setSchools:

console.log('First Node:', nodes[0]);
console.log('First School:', schools[0]);
console.log('First Edge:', edges[0]);

Vous devez voir:
  ✅ node.id (number)
  ✅ node.type ('BAC' | 'ETUDE_SUP' | 'METIER' | 'CERTIF')
  ✅ node.title (string)
  ✅ school.name (string)
  ✅ school.city (string)
  ✅ edge.source_id (number)
  ✅ edge.target_id (number)


═══════════════════════════════════════════════════════════════════════════
✅ TEST 5 : Tester le fallback mockData
═══════════════════════════════════════════════════════════════════════════

ÉTAPE 1: Modifiez temporairement apiService.ts

Dans fetchFormationsFromAPI(), changez l'URL pour qu'elle soit invalide:

const response = await fetch(
  'https://invalid.url.that.doesnt.exist' // ⚠️ POUR TEST SEULEMENT
);

ÉTAPE 2: Recharger l'app

Vous DEVEZ voir dans la console:
  ❌ Erreur lors du chargement: ...
  🔄 Chargement du fallback (données mockées)...
  ✅ 1 formations chargées (de mockData)

Et l'app continue de fonctionner avec les données mockées.

ÉTAPE 3: Revenez à l'URL valide!


═══════════════════════════════════════════════════════════════════════════
✅ TEST 6 : Tester le cache
═══════════════════════════════════════════════════════════════════════════

Rajoutez ce bouton temporaire dans App.tsx:

<button onClick={() => {
  const { dataService } = await import('./services/dataService');
  dataService.invalidateCache();
  window.location.reload();
}}>
  Forcer refresh
</button>

Cliquez dessus:
  🗑️ Cache invalidé
  📡 Démarrage du chargement des données ONISEP... (nouveau)

Le cache s'est bien vidé!


═══════════════════════════════════════════════════════════════════════════
✅ TEST 7 : Vérifier les types Node
═══════════════════════════════════════════════════════════════════════════

Mettez ce log dans useAkJolApp.ts après setNodes:

const types = nodes
  .reduce((acc, n) => ({ ...acc, [n.type]: (acc[n.type] || 0) + 1 }), {});
console.log('Distribution des types:', types);

Vous devez voir quelque chose comme:
  Distribution des types: 
    BAC: 8
    ETUDE_SUP: 60
    METIER: 20
    CERTIF: 12

Bonne distribution? Excellent!


═══════════════════════════════════════════════════════════════════════════
✅ TEST 8 : Vérifier les isLoading et error states
═══════════════════════════════════════════════════════════════════════════

Ajoutez ces logs dans App.tsx:

console.log('isLoading:', isLoading);
console.log('error:', error);

Sequence attendue:
  1. Première charge: isLoading = true, error = null
  2. Après chargement: isLoading = false, error = null
  3. (En cas d'erreur: isLoading = false, error = Error(...))


═══════════════════════════════════════════════════════════════════════════
🎯 RÉSUMÉ DES VÉRIFICATIONS
═══════════════════════════════════════════════════════════════════════════

Si TOUS ces tests passent ✅ :

  ✅ APIs accessibles
  ✅ Imports corrects
  ✅ Logs au démarrage visibles
  ✅ Structure de données correcte
  ✅ Fallback fonctionne
  ✅ Cache fonctionne
  ✅ Types détectés
  ✅ States (isLoading, error) corrects

👉 LA REFACTORISATION EST COMPLÈTE ET FONCTIONNE! 🎉


═══════════════════════════════════════════════════════════════════════════
🚨 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ "Module not found: dataService"
   └─ Vérifiez que les 3 fichiers (apiService, dataMapper, dataService) existent
   └─ dans src/services/

❌ "Erreur CORS"
   └─ C'est rare avec ces APIs, mais vérifiez que vous utilisez https://
   └─ En cas de problème, activez le proxy Vite

❌ "nodes is undefined"
   └─ Vérifiez que useEffect a bien lancé loadDataFromAPIs()
   └─ Attendez le premier render (isLoading = false) avant d'utiliser nodes

❌ "No data at all"
   └─ Vérifiez la console pour les logs d'erreur
   └─ Est-ce que le fallback mockData s'active?
   └─ Vérifiez que mockData.ts existe toujours

❌ "Les formations ne changent pas au reload"
   └─ C'est normal! Le cache garde les données 1 heure
   └─ Utilisez invalidateCache() pour tester

❌ "Les écoles sont vides"
   └─ Les 2 APIs peuvent avoir une structure légèrement différente
   └─ Vérifiez le mapping dans dataMapper.ts
   └─ Ajoutez des console.log(raw) pour voir la vraie structure


═══════════════════════════════════════════════════════════════════════════

Besoin d'aide? Laissez les console.log dans le code et partagez la console.
*/

export {};
