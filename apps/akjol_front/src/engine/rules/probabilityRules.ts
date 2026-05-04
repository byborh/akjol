/**
 * src/engine/rules/probabilityRules.ts
 * 
 * Business Rules - Success Probability Calculation (Pure Functions)
 * Logique exponentielle pour les pénalités
 */

import type { UserProfile, NodeRequirements } from '../types/userProfile';
import { calculateRequirementGaps } from './accessRules';

export interface ProbabilityResult {
  probability: number; // 0-1 (0% à 100%)
  riskLevel: 'safe' | 'medium' | 'risky';
  details: {
    mathGap: number;
    frenchGap: number;
    scienceGap: number;
    averageGap: number;
    totalPenalty: number;
  };
}

/**
 * RÈGLE MÉTIER #10: Calculer la probabilité de succès
 * 
 * Logique:
 * - Si stats >= requirements: 100%
 * - Si stats < requirements: pénalité exponentielle
 *   - 0.5 point de déficit: -5%
 *   - 1 point: -10%
 *   - 2 points: -30%
 *   - 3+ points: -70%+
 * 
 * @param userProfile - Profil utilisateur
 * @param requirements - Requirements du nœud
 * @returns Résultat avec probabilité et niveau de risque
 */
export function calculateSuccessProbability(
  userProfile: UserProfile,
  requirements?: NodeRequirements
): ProbabilityResult {
  // Aucun requirement = 100% de succès
  if (!requirements) {
    return {
      probability: 1,
      riskLevel: 'safe',
      details: {
        mathGap: 0,
        frenchGap: 0,
        scienceGap: 0,
        averageGap: 0,
        totalPenalty: 0
      }
    };
  }

  const gaps = calculateRequirementGaps(userProfile, requirements);
  let totalPenalty = 0;

  // Appliquer une pénalité exponentielle pour chaque gap
  if (gaps.math > 0) {
    totalPenalty += calculateExponentialPenalty(gaps.math) * 0.25; // 25% weight
  }

  if (gaps.french > 0) {
    totalPenalty += calculateExponentialPenalty(gaps.french) * 0.25; // 25% weight
  }

  if (gaps.science > 0) {
    totalPenalty += calculateExponentialPenalty(gaps.science) * 0.25; // 25% weight
  }

  if (gaps.average > 0) {
    totalPenalty += calculateExponentialPenalty(gaps.average) * 0.25; // 25% weight
  }

  // Calculer la probabilité finale (cap à 100%)
  const probability = Math.max(0, Math.min(1, 1 - totalPenalty));

  // Déterminer le niveau de risque
  const riskLevel = determineRiskLevel(probability);

  return {
    probability,
    riskLevel,
    details: {
      mathGap: gaps.math,
      frenchGap: gaps.french,
      scienceGap: gaps.science,
      averageGap: gaps.average,
      totalPenalty
    }
  };
}

/**
 * RÈGLE MÉTIER #11: Calculer une pénalité exponentielle
 * 
 * Formule: penalty = 0.1 * gap^1.5
 * - Gap 0.5: ~3.5% de pénalité
 * - Gap 1.0: ~10% de pénalité
 * - Gap 2.0: ~28% de pénalité
 * - Gap 3.0: ~52% de pénalité
 * - Gap 5.0: ~112% de pénalité (cap à 100%)
 */
function calculateExponentialPenalty(gap: number): number {
  if (gap <= 0) return 0;
  return 0.1 * Math.pow(gap, 1.5);
}

/**
 * RÈGLE MÉTIER #12: Déterminer le niveau de risque
 * 
 * @param probability - Probabilité de succès (0-1)
 * @returns Niveau de risque
 */
function determineRiskLevel(probability: number): 'safe' | 'medium' | 'risky' {
  if (probability >= 0.75) return 'safe';      // 75%+
  if (probability >= 0.40) return 'medium';    // 40-75%
  return 'risky';                              // <40%
}

/**
 * RÈGLE MÉTIER #13: Calculer la probabilité de réussite sur plusieurs années
 * 
 * Prend en compte une croissance naturelle des compétences
 * @param userProfile - Profil actuel
 * @param requirements - Requirements du nœud
 * @param years - Nombre d'années
 * @returns Probabilité après N années
 */
export function calculateFutureProbability(
  userProfile: UserProfile,
  requirements: NodeRequirements,
  years: number
): ProbabilityResult {
  // Simuler une croissance linéaire des stats (+0.5/an par matière)
  const futureProfile: UserProfile = {
    ...userProfile,
    stats: {
      math: Math.min(20, userProfile.stats.math + years * 0.5),
      french: Math.min(20, userProfile.stats.french + years * 0.5),
      science: Math.min(20, userProfile.stats.science + years * 0.5),
      average: Math.min(20, userProfile.stats.average + years * 0.5)
    }
  };

  return calculateSuccessProbability(futureProfile, requirements);
}
