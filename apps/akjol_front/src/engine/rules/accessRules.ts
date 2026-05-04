/**
 * src/engine/rules/accessRules.ts
 * 
 * Business Rules - Node Access Validation (Pure Functions)
 * Ces fonctions sont 100% testables sans interface graphique
 */

import type { UserProfile, NodeRequirements } from '../types/userProfile';

/**
 * RÈGLE MÉTIER #1: Peut-on accéder à un nœud ?
 * 
 * @param userProfile - Profil utilisateur actuel
 * @param requirements - Requirements du nœud cible
 * @returns true si l'accès est autorisé, false sinon
 * 
 * Logique:
 * - Si aucun requirement: accès libre (true)
 * - Si requirements présents: toutes les conditions doivent être remplies
 */
export function canAccessNode(
  userProfile: UserProfile,
  requirements?: NodeRequirements
): boolean {
  // Aucun requirement = accès libre
  if (!requirements) {
    return true;
  }

  const { stats } = userProfile;

  // Vérifier chaque requirement individuellement
  if (requirements.math !== undefined && stats.math < requirements.math) {
    return false;
  }

  if (requirements.french !== undefined && stats.french < requirements.french) {
    return false;
  }

  if (requirements.science !== undefined && stats.science < requirements.science) {
    return false;
  }

  if (requirements.average !== undefined && stats.average < requirements.average) {
    return false;
  }

  // Toutes les conditions sont remplies
  return true;
}

/**
 * RÈGLE MÉTIER #2: Calculer l'écart entre stats et requirements
 * 
 * @returns Un objet avec les écarts par matière (positif = déficit, négatif = surplus)
 */
export function calculateRequirementGaps(
  userProfile: UserProfile,
  requirements?: NodeRequirements
): {
  math: number;
  french: number;
  science: number;
  average: number;
  hasDeficit: boolean;
} {
  if (!requirements) {
    return {
      math: 0,
      french: 0,
      science: 0,
      average: 0,
      hasDeficit: false
    };
  }

  const { stats } = userProfile;

  const gaps = {
    math: requirements.math ? requirements.math - stats.math : 0,
    french: requirements.french ? requirements.french - stats.french : 0,
    science: requirements.science ? requirements.science - stats.science : 0,
    average: requirements.average ? requirements.average - stats.average : 0
  };

  const hasDeficit = Object.values(gaps).some(gap => gap > 0);

  return {
    ...gaps,
    hasDeficit
  };
}

/**
 * RÈGLE MÉTIER #3: Niveau de difficulté global d'un nœud
 * 
 * Basé sur les requirements et le profil utilisateur
 * @returns 'easy' | 'medium' | 'hard' | 'impossible'
 */
export function calculateDifficultyLevel(
  userProfile: UserProfile,
  requirements?: NodeRequirements
): 'easy' | 'medium' | 'hard' | 'impossible' {
  if (!requirements) {
    return 'easy';
  }

  const gaps = calculateRequirementGaps(userProfile, requirements);

  if (!gaps.hasDeficit) {
    return 'easy'; // L'utilisateur surpasse tous les requirements
  }

  // Calculer le gap moyen
  const totalGap = gaps.math + gaps.french + gaps.science + gaps.average;
  const averageGap = totalGap / 4;

  if (averageGap >= 4) return 'impossible'; // 4+ points de déficit moyen
  if (averageGap >= 2) return 'hard';       // 2-4 points
  if (averageGap >= 0.5) return 'medium';   // 0.5-2 points
  return 'easy';                            // < 0.5 points
}

/**
 * RÈGLE MÉTIER #4: Suggestions de points d'amélioration
 * 
 * Identifie les matières où l'utilisateur doit progresser
 */
export function suggestImprovements(
  userProfile: UserProfile,
  requirements?: NodeRequirements
): Array<{ subject: string; currentLevel: number; targetLevel: number; gap: number }> {
  if (!requirements) {
    return [];
  }

  const gaps = calculateRequirementGaps(userProfile, requirements);
  const suggestions: Array<{ subject: string; currentLevel: number; targetLevel: number; gap: number }> = [];

  if (gaps.math > 0) {
    suggestions.push({
      subject: 'Mathématiques',
      currentLevel: userProfile.stats.math,
      targetLevel: requirements.math!,
      gap: gaps.math
    });
  }

  if (gaps.french > 0) {
    suggestions.push({
      subject: 'Français',
      currentLevel: userProfile.stats.french,
      targetLevel: requirements.french!,
      gap: gaps.french
    });
  }

  if (gaps.science > 0) {
    suggestions.push({
      subject: 'Sciences',
      currentLevel: userProfile.stats.science,
      targetLevel: requirements.science!,
      gap: gaps.science
    });
  }

  if (gaps.average > 0) {
    suggestions.push({
      subject: 'Moyenne Générale',
      currentLevel: userProfile.stats.average,
      targetLevel: requirements.average!,
      gap: gaps.average
    });
  }

  // Trier par gap décroissant (priorité aux plus gros déficits)
  return suggestions.sort((a, b) => b.gap - a.gap);
}
