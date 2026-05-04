/**
 * src/engine/rules/__tests__/outcomeRules.test.ts
 * 
 * Tests Unitaires - Outcome Rules
 * Tests de la logique d'application d'effets (IMMUTABILITÉ)
 */

import { describe, it, expect } from 'vitest';
import { calculateOutcome, applyGlobalBoost, simulateGrowthOverTime, calculateReadinessScore } from '../outcomeRules';
import type { UserProfile, ProfileEffect } from '../../types/userProfile';

// Fixture: Profil de base
const baseProfile: UserProfile = {
  id: '1',
  name: 'Test User',
  stats: {
    math: 10,
    french: 10,
    science: 10,
    average: 10
  },
  level: 'Moyen',
  metadata: {
    money: 1000,
    stress: 30,
    skills: { javascript: 50 },
    achievements: []
  }
};

describe('calculateOutcome - Immutabilité', () => {
  it('ne devrait PAS modifier le profil original', () => {
    const effect: ProfileEffect = {
      stats: { math: 5 }
    };

    const newProfile = calculateOutcome(baseProfile, effect);

    // Le profil original ne doit pas avoir changé
    expect(baseProfile.stats.math).toBe(10);
    
    // Le nouveau profil a le changement
    expect(newProfile.stats.math).toBe(15);
  });

  it('devrait créer une copie profonde (nested objects)', () => {
    const effect: ProfileEffect = {
      metadata: { money: 500 }
    };

    const newProfile = calculateOutcome(baseProfile, effect);

    // Modifier le nouveau profil ne doit pas affecter l'original
    newProfile.metadata!.money = 99999;
    expect(baseProfile.metadata!.money).toBe(1000);
  });
});

describe('calculateOutcome - Stats', () => {
  it('devrait appliquer des bonus positifs', () => {
    const effect: ProfileEffect = {
      stats: {
        math: 3,
        french: 2,
        science: 1
      }
    };

    const result = calculateOutcome(baseProfile, effect);

    expect(result.stats.math).toBe(13);
    expect(result.stats.french).toBe(12);
    expect(result.stats.science).toBe(11);
  });

  it('devrait appliquer des malus négatifs', () => {
    const effect: ProfileEffect = {
      stats: {
        math: -3,
        french: -2
      }
    };

    const result = calculateOutcome(baseProfile, effect);

    expect(result.stats.math).toBe(7);
    expect(result.stats.french).toBe(8);
  });

  it('devrait clamper les stats entre 0 et 20', () => {
    const extremeEffect: ProfileEffect = {
      stats: {
        math: 15, // 10 + 15 = 25 → clampé à 20
        french: -15 // 10 - 15 = -5 → clampé à 0
      }
    };

    const result = calculateOutcome(baseProfile, extremeEffect);

    expect(result.stats.math).toBe(20);
    expect(result.stats.french).toBe(0);
  });

  it('devrait recalculer la moyenne automatiquement', () => {
    const effect: ProfileEffect = {
      stats: {
        math: 2, // 10 → 12
        french: 4, // 10 → 14
        science: 6  // 10 → 16
      }
    };

    const result = calculateOutcome(baseProfile, effect);

    // Moyenne = (12 + 14 + 16) / 3 = 14
    expect(result.stats.average).toBe(14);
  });

  it('devrait recalculer le level basé sur la moyenne', () => {
    const boostEffect: ProfileEffect = {
      stats: {
        math: 5,
        french: 5,
        science: 5
      }
    };

    const result = calculateOutcome(baseProfile, boostEffect);

    // Moyenne passe à 15 → level devient "Avancé"
    expect(result.level).toBe('Avancé');
  });
});

describe('calculateOutcome - Metadata', () => {
  it('devrait modifier l\'argent', () => {
    const effect: ProfileEffect = {
      metadata: { money: 500 }
    };

    const result = calculateOutcome(baseProfile, effect);

    expect(result.metadata!.money).toBe(1500);
  });

  it('devrait modifier le stress avec clamping', () => {
    const effect: ProfileEffect = {
      metadata: { stress: 80 } // 30 + 80 = 110 → clampé à 100
    };

    const result = calculateOutcome(baseProfile, effect);

    expect(result.metadata!.stress).toBe(100);
  });

  it('devrait ajouter de nouvelles compétences', () => {
    const effect: ProfileEffect = {
      metadata: {
        skills: {
          python: 30,
          react: 40
        }
      }
    };

    const result = calculateOutcome(baseProfile, effect);

    expect(result.metadata!.skills!.javascript).toBe(50); // Existant préservé
    expect(result.metadata!.skills!.python).toBe(30); // Nouveau
    expect(result.metadata!.skills!.react).toBe(40); // Nouveau
  });

  it('devrait modifier des compétences existantes', () => {
    const effect: ProfileEffect = {
      metadata: {
        skills: {
          javascript: 20 // 50 + 20 = 70
        }
      }
    };

    const result = calculateOutcome(baseProfile, effect);

    expect(result.metadata!.skills!.javascript).toBe(70);
  });
});

describe('applyGlobalBoost', () => {
  it('devrait booster toutes les matières', () => {
    const result = applyGlobalBoost(baseProfile, 3);

    expect(result.stats.math).toBe(13);
    expect(result.stats.french).toBe(13);
    expect(result.stats.science).toBe(13);
  });

  it('devrait gérer les malus globaux', () => {
    const result = applyGlobalBoost(baseProfile, -2);

    expect(result.stats.math).toBe(8);
    expect(result.stats.french).toBe(8);
    expect(result.stats.science).toBe(8);
  });
});

describe('simulateGrowthOverTime', () => {
  it('devrait simuler une croissance sur plusieurs années', () => {
    const result = simulateGrowthOverTime(baseProfile, 3, 0.1);

    // Avec un taux de 10% par an, les stats devraient augmenter
    expect(result.stats.math).toBeGreaterThan(baseProfile.stats.math);
    expect(result.stats.average).toBeGreaterThan(baseProfile.stats.average);
  });

  it('ne devrait pas dépasser 20', () => {
    const highProfile: UserProfile = {
      ...baseProfile,
      stats: { math: 18, french: 18, science: 18, average: 18 }
    };

    const result = simulateGrowthOverTime(highProfile, 10, 0.2);

    expect(result.stats.math).toBeLessThanOrEqual(20);
    expect(result.stats.french).toBeLessThanOrEqual(20);
    expect(result.stats.science).toBeLessThanOrEqual(20);
  });
});

describe('calculateReadinessScore', () => {
  it('devrait retourner 100 si aucun requirement', () => {
    const score = calculateReadinessScore(baseProfile);
    expect(score).toBe(100);
  });

  it('devrait retourner un score eleve mais pas automatiquement 100 si stats depassent legerement les requirements', () => {
    const score = calculateReadinessScore(baseProfile, {
      math: 8,
      french: 8,
      science: 8
    });
    expect(score).toBe(75);
  });

  it('devrait calculer un score partiel si déficit', () => {
    const score = calculateReadinessScore(baseProfile, {
      math: 20, // Déficit de 10 points
      french: 10, // OK
      science: 10 // OK
    });

    // Math: 35%, French: 70%, Science: 70% -> Moyenne: ~58%
    expect(score).toBeCloseTo(58, 0);
  });

  it('devrait gérer des requirements partiels', () => {
    const score = calculateReadinessScore(baseProfile, {
      math: 15
    });

    // 10 / 15 * 70 = 46.67%
    expect(score).toBeCloseTo(47, 0);
  });

  it('devrait retourner 70 quand les stats sont exactement au minimum requis', () => {
    const exactProfile: UserProfile = {
      ...baseProfile,
      stats: {
        math: 12,
        french: 11,
        science: 10,
        average: 11
      }
    };

    const score = calculateReadinessScore(exactProfile, {
      math: 12,
      french: 11,
      science: 10,
      average: 11
    });

    expect(score).toBe(70);
  });
});
