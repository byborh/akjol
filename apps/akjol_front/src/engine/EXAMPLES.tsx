/**
 * EXEMPLE D'UTILISATION - Clean Architecture
 * 
 * Ce fichier montre comment utiliser les règles métier dans un composant React
 * en suivant les principes Clean Architecture
 */

import React from 'react';
import { 
  canAccessNode, 
  calculateSuccessProbability,
  calculateOutcome,
  suggestImprovements 
} from '../engine/rules';
import type { UserProfile, ProfileEffect } from '../engine/types/userProfile';

// ========================================
// EXEMPLE 1 : Vérifier l'accès à un nœud
// ========================================

function NodeAccessExample() {
  const userProfile: UserProfile = {
    id: '1',
    name: 'Alexandre',
    stats: { math: 14, french: 13, science: 12, average: 13 },
    level: 'Moyen'
  };

  const nodeRequirements = { math: 12, average: 11 };

  // ✅ Logique métier déléguée à engine/rules (testable!)
  const canAccess = canAccessNode(userProfile, nodeRequirements);

  return (
    <div>
      {canAccess ? (
        <button>Accéder au nœud</button>
      ) : (
        <div>
          <p>Requirements non remplis</p>
          {/* Afficher les suggestions d'amélioration */}
          {suggestImprovements(userProfile, nodeRequirements).map((suggestion: any) => (
            <li key={suggestion.subject}>
              {suggestion.subject}: {suggestion.currentLevel} → {suggestion.targetLevel} 
              (gap: {suggestion.gap})
            </li>
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================
// EXEMPLE 2 : Afficher la probabilité de succès
// ========================================

function SuccessProbabilityExample() {
  const userProfile: UserProfile = {
    id: '2',
    name: 'Marie',
    stats: { math: 10, french: 11, science: 9, average: 10 },
    level: 'Moyen'
  };

  const nodeRequirements = { math: 13, science: 12, average: 12 };

  // ✅ Calcul de probabilité via règles métier
  const result = calculateSuccessProbability(userProfile, nodeRequirements);

  const getRiskColor = () => {
    switch (result.riskLevel) {
      case 'safe': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'risky': return 'text-red-500';
    }
  };

  return (
    <div>
      <h3>Probabilité de succès</h3>
      <div className={getRiskColor()}>
        {Math.round(result.probability * 100)}%
      </div>
      <div>
        <p>Écarts:</p>
        <ul>
          <li>Maths: {result.details.mathGap > 0 ? `-${result.details.mathGap}` : 'OK'}</li>
          <li>Sciences: {result.details.scienceGap > 0 ? `-${result.details.scienceGap}` : 'OK'}</li>
          <li>Moyenne: {result.details.averageGap > 0 ? `-${result.details.averageGap}` : 'OK'}</li>
        </ul>
      </div>
    </div>
  );
}

// ========================================
// EXEMPLE 3 : Appliquer un événement (effet)
// ========================================

function EventApplicationExample() {
  const [userProfile, setUserProfile] = React.useState<UserProfile>({
    id: '3',
    name: 'Jean',
    stats: { math: 12, french: 11, science: 13, average: 12 },
    level: 'Moyen',
    metadata: { money: 1000, stress: 30, skills: {}, achievements: [] }
  });

  const handleEventTrigger = () => {
    // Événement : Bourse d'excellence
    const effect: ProfileEffect = {
      stats: { math: 1, french: 1, science: 1 },
      metadata: { money: 5000, stress: -5 }
    };

    // ✅ Calcul immutable via règles métier
    const newProfile = calculateOutcome(userProfile, effect);
    
    // ✅ Le profil original n'est PAS modifié
    // ✅ React reçoit un nouvel objet (bon pour le re-render)
    setUserProfile(newProfile);
  };

  return (
    <div>
      <h3>Profil de {userProfile.name}</h3>
      <p>Maths: {userProfile.stats.math}</p>
      <p>Argent: {userProfile.metadata?.money}€</p>
      <p>Stress: {userProfile.metadata?.stress}</p>
      
      <button onClick={handleEventTrigger}>
        Déclencher événement "Bourse d'excellence"
      </button>
    </div>
  );
}

// ========================================
// EXEMPLE 4 : Comparaison AVANT/APRÈS
// ========================================

// ❌ AVANT (logique dans le composant)
// @ts-ignore - Example code for documentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BeforeRefactoringExample({ userStats, nodeRequirements }: any) {
  // Logique métier couplée au composant → NON TESTABLE!
  const canAccess = () => {
    if (!nodeRequirements) return true;
    
    if (nodeRequirements.math && userStats.math < nodeRequirements.math) {
      return false;
    }
    
    if (nodeRequirements.french && userStats.french < nodeRequirements.french) {
      return false;
    }
    
    // ... encore 50 lignes de if/else ...
    
    return true;
  };

  return <button disabled={!canAccess()}>Accéder</button>;
}

// ✅ APRÈS (logique déléguée à engine/rules)
// @ts-ignore - Example code for documentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AfterRefactoringExample({ userProfile, nodeRequirements }: any) {
  // Une seule ligne, testable, réutilisable!
  const canAccess = canAccessNode(userProfile, nodeRequirements);

  return <button disabled={!canAccess}>Accéder</button>;
}

// ========================================
// EXEMPLE 5 : Test Unitaire Correspondant
// ========================================

/*
// Dans __tests__/accessRules.test.ts

import { canAccessNode } from '../accessRules';

it('devrait autoriser l\'accès si stats >= requirements', () => {
  const profile = {
    id: '1',
    name: 'Test',
    stats: { math: 14, french: 13, science: 12, average: 13 },
    level: 'Moyen'
  };
  
  const requirements = { math: 12, average: 11 };
  
  expect(canAccessNode(profile, requirements)).toBe(true);
});

// ✅ Ce test tourne en 1ms, sans navigateur ni serveur!
*/

// ========================================
// EXPORT EXEMPLE COMPLET
// ========================================

export default function CleanArchitectureDemo() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Clean Architecture - Exemples</h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">1. Vérification d'accès</h2>
        <NodeAccessExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">2. Probabilité de succès</h2>
        <SuccessProbabilityExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">3. Application d'événement</h2>
        <EventApplicationExample />
      </section>
    </div>
  );
}
