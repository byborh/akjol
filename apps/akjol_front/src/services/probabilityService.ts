/**
 * src/services/probabilityService.ts
 *
 * Service Layer - Probability Calculation
 * Délègue la logique métier au engine/rules (Clean Architecture)
 * 
 * @deprecated Use engine/rules directly for testability
 */

import type { UserStats, NodeRequirements } from '../types';
import { userStatsToProfile } from '../engine/adapters/profileAdapter';
import { calculateSuccessProbability as calculateProbability } from '../engine/rules/probabilityRules';
import type { NodeRequirements as EngineRequirements } from '../engine/types/userProfile';

export interface SuccessProbabilityResult {
  probability: number; // 0-1 (0% à 100%)
  riskLevel: 'safe' | 'medium' | 'risky'; // Catégorie de risque
  details: {
    mathGap?: number;
    frenchGap?: number;
    scienceGap?: number;
    averageGap?: number;
    totalPenalty?: number;
  };
}

/**
 * Calcule la probabilité de succès pour accéder à un nœud
 * 
 * @deprecated Use engine/rules/probabilityRules directly
 * This function is kept for backward compatibility
 * 
 * Logique déléguée au engine/rules (testable unitairement)
 */
export function calculateSuccessProbability(
  userStats: UserStats,
  nodeRequirements?: NodeRequirements
): SuccessProbabilityResult {
  // Convert legacy types to Clean Architecture types
  const userProfile = userStatsToProfile(userStats);
  const engineRequirements = nodeRequirements as EngineRequirements | undefined;

  // Delegate to business rules (pure functions)
  const result = calculateProbability(userProfile, engineRequirements);

  // Convert back to legacy format
  return {
    probability: result.probability,
    riskLevel: result.riskLevel,
    details: {
      mathGap: result.details.mathGap,
      frenchGap: result.details.frenchGap,
      scienceGap: result.details.scienceGap,
      averageGap: result.details.averageGap,
      totalPenalty: result.details.totalPenalty
    }
  };
}

/**
 * Helper: Formatte la probabilité en pourcentage lisible
 */
export function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * Helper: Retourne le ratio d'accessibilité (pour affichage)
 */
export function getProbabilityMetrics(probability: number) {
  const riskLevel = determineRiskLevel(probability);
  return {
    percentage: Math.round(probability * 100),
    riskLevel,
    color: getColorForRiskLevel(riskLevel)
  };
}

/**
 * Helper: Détermine le niveau de risque (réimporté depuis engine)
 */
function determineRiskLevel(probability: number): 'safe' | 'medium' | 'risky' {
  if (probability >= 0.75) return 'safe';
  if (probability >= 0.4) return 'medium';
  return 'risky';
}

/**
 * Helper: Couleur Tailwind pour le niveau de risque
 */
export function getColorForRiskLevel(riskLevel: 'safe' | 'medium' | 'risky'): string {
  switch (riskLevel) {
    case 'safe':
      return 'from-green-500 to-green-600';
    case 'medium':
      return 'from-yellow-500 to-yellow-600';
    case 'risky':
      return 'from-red-500 to-red-600';
  }
}

/**
 * Helper: Texte pour le niveau de risque
 */
export function getRiskLevelText(riskLevel: 'safe' | 'medium' | 'risky'): string {
  switch (riskLevel) {
    case 'safe':
      return '✅ Très accessible';
    case 'medium':
      return '⚠️ Faisable avec efforts';
    case 'risky':
      return '🔴 Très difficile';
  }
}
