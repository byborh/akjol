# Clean Architecture - Engine Rules

## 📁 Structure

```
src/
├── engine/
│   ├── types/
│   │   └── userProfile.ts         # Domain Models (types purs)
│   ├── rules/
│   │   ├── accessRules.ts        # Règles d'accès aux nœuds
│   │   ├── outcomeRules.ts       # Règles de calcul d'effets
│   │   ├── probabilityRules.ts   # Règles de probabilité
│   │   ├── index.ts              # Barrel export
│   │   └── __tests__/            # Tests unitaires
│   │       ├── accessRules.test.ts
│   │       └── outcomeRules.test.ts
│   └── adapters/
│       └── profileAdapter.ts     # Bridge legacy ↔ Clean Architecture
├── services/
│   ├── probabilityService.ts     # Service Layer (deprecated, délègue à engine/)
│   └── eventService.ts           # Service Layer (deprecated, délègue à engine/)
└── components/                   # React Components (UI Layer)
```

## 🎯 Principes Clean Architecture

### 1. **Domain Layer (engine/types/)**
Types purs représentant le métier, sans dépendances externes.

```typescript
interface UserProfile {
  id: string;
  name: string;
  stats: { math: number; french: number; science: number; average: number };
  level: 'Débutant' | 'Moyen' | 'Avancé';
  metadata?: { ... };
}
```

### 2. **Business Rules Layer (engine/rules/)**
Fonctions pures contenant toute la logique métier. **100% testables unitairement**.

#### Caractéristiques :
- ✅ **Pures** : Pas d'effets de bord
- ✅ **Immutables** : Retournent de nouveaux objets
- ✅ **Testables** : Pas besoin d'interface graphique
- ✅ **Documentées** : JSDoc complet

#### Exemple :
```typescript
// ❌ AVANT (logique dans le composant)
function handleClick() {
  if (userStats.math >= nodeRequirements.math && 
      userStats.french >= nodeRequirements.french) {
    navigate(nodeId);
  }
}

// ✅ APRÈS (logique dans engine/rules)
import { canAccessNode } from '@/engine/rules';

function handleClick() {
  if (canAccessNode(userProfile, nodeRequirements)) {
    navigate(nodeId);
  }
}
```

### 3. **Adapter Layer (engine/adapters/)**
Fait le pont entre les types legacy et les types Clean Architecture.

```typescript
// Conversion legacy → Clean Architecture
const userProfile = userStatsToProfile(userStats);

// Conversion Clean Architecture → legacy
const userStats = profileToUserStats(userProfile);
```

### 4. **Service Layer (services/)**
Ancienne couche, maintenant **deprecated**. Délègue à `engine/rules/`.

### 5. **UI Layer (components/)**
Composants React. **Aucune logique métier** dedans, uniquement :
- Rendu visuel
- Gestion d'événements UI
- Appels aux règles métier

---

## 📦 API des Règles Métier

### Access Rules (`engine/rules/accessRules.ts`)

#### `canAccessNode(userProfile, requirements): boolean`
Vérifie si l'utilisateur peut accéder à un nœud.

```typescript
import { canAccessNode } from '@/engine/rules';

const profile = { ... };
const requirements = { math: 12, average: 11 };

if (canAccessNode(profile, requirements)) {
  console.log('✅ Accès autorisé');
} else {
  console.log('❌ Requirements non remplis');
}
```

#### `calculateRequirementGaps(userProfile, requirements)`
Calcule les écarts entre stats et requirements.

```typescript
const gaps = calculateRequirementGaps(profile, requirements);
// { math: -2, french: 0, science: 1, average: -0.5, hasDeficit: true }
```

#### `calculateDifficultyLevel(userProfile, requirements)`
Détermine la difficulté : `'easy' | 'medium' | 'hard' | 'impossible'`.

#### `suggestImprovements(userProfile, requirements)`
Liste les matières à améliorer, triées par priorité.

```typescript
const suggestions = suggestImprovements(profile, requirements);
// [{ subject: 'Mathématiques', currentLevel: 10, targetLevel: 12, gap: 2 }, ...]
```

---

### Outcome Rules (`engine/rules/outcomeRules.ts`)

#### `calculateOutcome(userProfile, effect): UserProfile`
Applique un effet sur le profil. **IMMUTABLE** : retourne un nouvel objet.

```typescript
import { calculateOutcome } from '@/engine/rules';

const effect = {
  stats: { math: 2, french: 1 },
  metadata: { money: 500, stress: -10 }
};

const newProfile = calculateOutcome(profile, effect);
// profile original NON MODIFIÉ ✅
// newProfile a les stats mises à jour ✅
```

#### `applyGlobalBoost(userProfile, boost): UserProfile`
Applique un boost à toutes les matières.

```typescript
const boosted = applyGlobalBoost(profile, 3);
// Toutes les stats +3
```

#### `simulateGrowthOverTime(userProfile, years, growthRate): UserProfile`
Simule une évolution sur N années.

```typescript
const futureProfile = simulateGrowthOverTime(profile, 5, 0.05);
// Profile après 5 ans avec +5% de croissance annuelle
```

#### `calculateReadinessScore(userProfile, requirements): number`
Score de 0 à 100 indiquant le niveau de préparation.

---

### Probability Rules (`engine/rules/probabilityRules.ts`)

#### `calculateSuccessProbability(userProfile, requirements): ProbabilityResult`
Calcule la probabilité de succès avec pénalité exponentielle.

```typescript
const result = calculateSuccessProbability(profile, requirements);
// {
//   probability: 0.82,
//   riskLevel: 'safe',
//   details: { mathGap: 0, frenchGap: -1, ... }
// }
```

#### `calculateFutureProbability(userProfile, requirements, years): ProbabilityResult`
Probabilité après N années de croissance.

---

## 🧪 Tests Unitaires

### Installation
```bash
npm install vitest --save-dev
```

### Lancer les tests
```bash
# Tous les tests
npx vitest

# Tests spécifiques
npx vitest src/engine/rules/__tests__/accessRules.test.ts

# Mode watch
npx vitest --watch
```

### Exemple de test
```typescript
import { canAccessNode } from '../accessRules';

it('devrait autoriser l\'accès si stats >= requirements', () => {
  const profile = { stats: { math: 14, french: 13, science: 12, average: 13 } };
  const requirements = { math: 12, average: 11 };
  
  expect(canAccessNode(profile, requirements)).toBe(true);
});
```

### Pourquoi c'est important ?
- ✅ Pas besoin de lancer l'app pour tester la logique
- ✅ Tests ultra-rapides (millisecondes)
- ✅ Détection précoce des bugs
- ✅ Documentation vivante du comportement

---

## 🔄 Migration Progressive

### Étape 1 : Utiliser les adapters (rétro-compatibilité)
```typescript
// Dans un composant existant
import { userStatsToProfile } from '@/engine/adapters/profileAdapter';
import { canAccessNode } from '@/engine/rules';

const profile = userStatsToProfile(userStats); // Conversion
const canAccess = canAccessNode(profile, requirements); // Pure logic
```

### Étape 2 : Migrer vers UserProfile partout
```typescript
// Changer les props des composants
interface Props {
  userProfile: UserProfile; // ✅ Au lieu de userStats: UserStats
}
```

### Étape 3 : Supprimer les services legacy
Une fois que tout utilise `engine/rules/`, supprimer :
- `src/services/probabilityService.ts`
- `src/services/eventService.ts`

---

## 📚 Best Practices

### ✅ DO
- Mettre TOUTE la logique métier dans `engine/rules/`
- Écrire des tests pour chaque règle métier
- Garder les fonctions pures (pas d'effets de bord)
- Utiliser l'immutabilité (retourner de nouveaux objets)
- Documenter avec JSDoc

### ❌ DON'T
- Mettre de la logique métier dans les composants React
- Modifier directement les objets (mutation)
- Faire des appels API dans les règles métier
- Dépendre de React, Framer Motion, ou autres libs UI

---

## 🎓 Avantages

1. **Testabilité** : Tests unitaires sans navigateur ni serveur
2. **Maintenabilité** : Logique centralisée et réutilisable
3. **Scalabilité** : Facile d'ajouter de nouvelles règles
4. **Documentation** : Le code est auto-documenté
5. **Portabilité** : Réutilisable dans un backend Node.js si besoin

---

## 📖 Ressources

- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Vitest Documentation](https://vitest.dev/)
- [Functional Programming Principles](https://en.wikipedia.org/wiki/Functional_programming)
