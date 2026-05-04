/**
 * src/engine/rules/outcomeRules.ts
 * 
 * Business Rules - Outcome Calculation (Pure Functions)
 * Application d'effets sur un profil utilisateur (IMMUTABILITÉ)
 */

import type { UserProfile, ProfileEffect } from '../types/userProfile';
import { clamp } from '../types/userProfile';

/**
 * RÈGLE MÉTIER #5: Calculer le résultat d'une action
 * 
 * Applique un effet (EventEffect, NodeTransition, etc.) sur le profil utilisateur
 * 
 * @param userProfile - Profil utilisateur actuel (non modifié)
 * @param effect - Effet à appliquer
 * @returns Nouveau profil utilisateur modifié (IMMUTABILITÉ)
 * 
 * Principes Clean Architecture:
 * - Fonction PURE (pas d'effet de bord)
 * - Immutabilité (retourne un nouvel objet)
 * - Testable unitairement
 */
export function calculateOutcome(
  userProfile: UserProfile,
  effect: ProfileEffect
): UserProfile {
  // Clone profond pour garantir l'immutabilité
  const newProfile: UserProfile = {
    id: userProfile.id,
    name: userProfile.name,
    stats: { ...userProfile.stats },
    level: userProfile.level,
    metadata: userProfile.metadata ? {
      money: userProfile.metadata.money ?? 0,
      stress: userProfile.metadata.stress ?? 0,
      skills: { ...userProfile.metadata.skills },
      achievements: [...(userProfile.metadata.achievements ?? [])]
    } : undefined
  };

  // Appliquer les modifications de stats (avec clamping 0-20)
  if (effect.stats) {
    if (effect.stats.math !== undefined) {
      newProfile.stats.math = clamp(
        newProfile.stats.math + effect.stats.math,
        0,
        20
      );
    }

    if (effect.stats.french !== undefined) {
      newProfile.stats.french = clamp(
        newProfile.stats.french + effect.stats.french,
        0,
        20
      );
    }

    if (effect.stats.science !== undefined) {
      newProfile.stats.science = clamp(
        newProfile.stats.science + effect.stats.science,
        0,
        20
      );
    }

    if (effect.stats.average !== undefined) {
      newProfile.stats.average = clamp(
        newProfile.stats.average + effect.stats.average,
        0,
        20
      );
    }
  }

  // Recalculer la moyenne générale basée sur les 3 matières
  newProfile.stats.average = Math.round(
    ((newProfile.stats.math + newProfile.stats.french + newProfile.stats.science) / 3) * 10
  ) / 10;

  // Recalculer le level basé sur la nouvelle moyenne
  if (newProfile.stats.average >= 14) {
    newProfile.level = 'Avancé';
  } else if (newProfile.stats.average >= 10) {
    newProfile.level = 'Moyen';
  } else {
    newProfile.level = 'Débutant';
  }

  // Appliquer les modifications de metadata
  if (effect.metadata && newProfile.metadata) {
    if (effect.metadata.money !== undefined) {
      newProfile.metadata.money = (newProfile.metadata.money ?? 0) + effect.metadata.money;
    }

    if (effect.metadata.stress !== undefined) {
      newProfile.metadata.stress = clamp(
        (newProfile.metadata.stress ?? 0) + effect.metadata.stress,
        0,
        100
      );
    }

    if (effect.metadata.skills) {
      Object.entries(effect.metadata.skills).forEach(([skill, value]) => {
        const currentValue = newProfile.metadata!.skills![skill] ?? 0;
        newProfile.metadata!.skills![skill] = clamp(currentValue + value, 0, 100);
      });
    }
  }

  return newProfile;
}

/**
 * RÈGLE MÉTIER #6: Appliquer un boost général à toutes les stats
 * 
 * @param userProfile - Profil actuel
 * @param boost - Valeur du boost (peut être négatif)
 * @returns Nouveau profil avec boost appliqué
 */
export function applyGlobalBoost(
  userProfile: UserProfile,
  boost: number
): UserProfile {
  return calculateOutcome(userProfile, {
    stats: {
      math: boost,
      french: boost,
      science: boost
    }
  });
}

/**
 * RÈGLE MÉTIER #7: Simuler une évolution sur N années
 * 
 * Applique une progression naturelle des compétences
 * @param userProfile - Profil actuel
 * @param years - Nombre d'années
 * @param growthRate - Taux de croissance annuel (0.05 = +5% par an)
 * @returns Nouveau profil après évolution
 */
export function simulateGrowthOverTime(
  userProfile: UserProfile,
  years: number,
  growthRate: number = 0.05
): UserProfile {
  let currentProfile = userProfile;

  for (let i = 0; i < years; i++) {
    const boost = currentProfile.stats.average * growthRate;
    currentProfile = applyGlobalBoost(currentProfile, boost);
  }

  return currentProfile;
}

/**
 * RÈGLE MÉTIER #8: Calculer l'impact d'un multiplicateur de salaire
 * 
 * Stocke le modificateur dans la metadata pour usage futur
 * @param userProfile - Profil actuel
 * @param salaryMultiplier - Multiplicateur (1.0 = normal, 1.5 = +50%, 0.8 = -20%)
 * @returns Nouveau profil avec multiplicateur appliqué
 */
export function applySalaryModifier(
  userProfile: UserProfile,
  salaryMultiplier: number
): UserProfile {
  const newProfile = { ...userProfile };
  
  if (!newProfile.metadata) {
    newProfile.metadata = {
      money: 0,
      stress: 0,
      skills: {},
      achievements: []
    };
  }

  // Store the multiplier in metadata for future computation
  if (!newProfile.metadata.skills) {
    newProfile.metadata.skills = {};
  }
  
  newProfile.metadata.skills['salary_multiplier'] = salaryMultiplier;

  return newProfile;
}

/**
 * RÈGLE MÉTIER #9: Calculer un score de "readiness" pour un nœud
 * 
 * Score de 0 à 100 indiquant à quel point l'utilisateur est prêt
 * @returns Score entre 0 (pas prêt du tout) et 100 (surqualifié)
 */
export function calculateReadinessScore(
  userProfile: UserProfile,
  requirements?: { math?: number; french?: number; science?: number; average?: number }
): number {
  if (!requirements) {
    return 100; // Aucun requirement = 100% prêt
  }

  let totalScore = 0;
  let criteriaCount = 0;

  // Score progressif:
  // - En dessous du minimum requis: 0 -> 70
  // - Au minimum requis: 70
  // - Au-dessus du minimum: 70 -> 100 selon proximité de 20/20
  const scoreForRequirement = (current: number, required: number): number => {
    if (required <= 0) return 100;

    if (current < required) {
      return Math.max(0, (current / required) * 70);
    }

    const headroom = 20 - required;
    if (headroom <= 0) {
      return 100;
    }

    const progressAboveMin = Math.min(1, (current - required) / headroom);
    return 70 + progressAboveMin * 30;
  };

  if (requirements.math !== undefined) {
    const score = scoreForRequirement(userProfile.stats.math, requirements.math);
    totalScore += score;
    criteriaCount++;
  }

  if (requirements.french !== undefined) {
    const score = scoreForRequirement(userProfile.stats.french, requirements.french);
    totalScore += score;
    criteriaCount++;
  }

  if (requirements.science !== undefined) {
    const score = scoreForRequirement(userProfile.stats.science, requirements.science);
    totalScore += score;
    criteriaCount++;
  }

  if (requirements.average !== undefined) {
    const score = scoreForRequirement(userProfile.stats.average, requirements.average);
    totalScore += score;
    criteriaCount++;
  }

  return criteriaCount > 0 ? Math.round(totalScore / criteriaCount) : 100;
}
