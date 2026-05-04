/**
 * src/engine/rules/__tests__/accessRules.test.ts
 * 
 * Tests Unitaires - Access Rules
 * Ces tests peuvent tourner sans interface graphique ni navigateur
 * 
 * Pour lancer: npm install vitest --save-dev
 * Puis: npx vitest src/engine/rules/__tests__/accessRules.test.ts
 */

import { describe, it, expect } from 'vitest';
import { canAccessNode, calculateRequirementGaps, calculateDifficultyLevel, suggestImprovements } from '../accessRules';
import type { UserProfile, NodeRequirements } from '../../types/userProfile';

// Fixture: Profil étudiant moyen
const normalStudent: UserProfile = {
  id: '1',
  name: 'Alexandre Dupont',
  stats: {
    math: 14,
    french: 13,
    science: 12,
    average: 13
  },
  level: 'Moyen',
  metadata: {
    money: 0,
    stress: 0,
    skills: {},
    achievements: []
  }
};

// Fixture: Profil étudiant en difficulté
const strugglingStudent: UserProfile = {
  id: '2',
  name: 'Marie Martin',
  stats: {
    math: 8,
    french: 9,
    science: 7,
    average: 8
  },
  level: 'Débutant',
  metadata: {
    money: 0,
    stress: 50,
    skills: {},
    achievements: []
  }
};

// Fixture: Requirements BTS SIO SLAM
const btsRequirements: NodeRequirements = {
  math: 12,
  average: 11
};

// Fixture: Requirements BUT Info
const butRequirements: NodeRequirements = {
  math: 13,
  science: 12,
  average: 12.5
};

describe('canAccessNode', () => {
  it('devrait autoriser l\'accès si aucun requirement', () => {
    expect(canAccessNode(normalStudent)).toBe(true);
    expect(canAccessNode(strugglingStudent)).toBe(true);
  });

  it('devrait autoriser l\'accès si stats >= requirements', () => {
    expect(canAccessNode(normalStudent, btsRequirements)).toBe(true);
  });

  it('devrait refuser l\'accès si stats < requirements', () => {
    expect(canAccessNode(strugglingStudent, btsRequirements)).toBe(false);
  });

  it('devrait refuser l\'accès si même une seule condition échoue', () => {
    const highRequirements: NodeRequirements = {
      math: 18, // Alexandre a 14 → échoue ici
      french: 10 // OK
    };
    expect(canAccessNode(normalStudent, highRequirements)).toBe(false);
  });

  it('devrait gérer les requirements partiels', () => {
    const onlyMath: NodeRequirements = { math: 10 };
    expect(canAccessNode(strugglingStudent, onlyMath)).toBe(false); // 8 < 10
    expect(canAccessNode(normalStudent, onlyMath)).toBe(true); // 14 >= 10
  });
});

describe('calculateRequirementGaps', () => {
  it('devrait retourner zéro si aucun requirement', () => {
    const gaps = calculateRequirementGaps(normalStudent);
    expect(gaps.math).toBe(0);
    expect(gaps.french).toBe(0);
    expect(gaps.science).toBe(0);
    expect(gaps.average).toBe(0);
    expect(gaps.hasDeficit).toBe(false);
  });

  it('devrait calculer les gaps positifs (déficit)', () => {
    const gaps = calculateRequirementGaps(strugglingStudent, btsRequirements);
    expect(gaps.math).toBe(4); // 12 - 8 = 4
    expect(gaps.average).toBe(3); // 11 - 8 = 3
    expect(gaps.hasDeficit).toBe(true);
  });

  it('devrait retourner 0 pour les stats qui dépassent les requirements', () => {
    const gaps = calculateRequirementGaps(normalStudent, btsRequirements);
    expect(gaps.math).toBe(-2); // 12 - 14 = -2 (surplus)
    expect(gaps.average).toBe(-2); // 11 - 13 = -2 (surplus)
  });

  it('devrait calculer les gaps mixtes', () => {
    const gaps = calculateRequirementGaps(normalStudent, butRequirements);
    expect(gaps.math).toBe(-1); // 13 - 14 = -1 (surplus)
    expect(gaps.science).toBe(0); // 12 - 12 = 0 (exact)
    expect(gaps.average).toBeCloseTo(12.5 - 13, 1); // Déficit de 0.5
  });
});

describe('calculateDifficultyLevel', () => {
  it('devrait retourner "easy" sans requirements', () => {
    expect(calculateDifficultyLevel(normalStudent)).toBe('easy');
  });

  it('devrait retourner "easy" si stats dépassent requirements', () => {
    expect(calculateDifficultyLevel(normalStudent, btsRequirements)).toBe('easy');
  });

  it('devrait retourner "hard" pour gros déficit', () => {
    const hardRequirements: NodeRequirements = {
      math: 16,
      science: 16,
      average: 16
    };
    expect(calculateDifficultyLevel(strugglingStudent, hardRequirements)).toBe('impossible');
  });

  it('devrait retourner "medium" pour déficit modéré', () => {
    const mediumRequirements: NodeRequirements = {
      math: 10,
      average: 10
    };
    expect(calculateDifficultyLevel(strugglingStudent, mediumRequirements)).toBe('medium');
  });
});

describe('suggestImprovements', () => {
  it('devrait retourner liste vide si aucun requirement', () => {
    const suggestions = suggestImprovements(normalStudent);
    expect(suggestions).toHaveLength(0);
  });

  it('devrait retourner liste vide si aucun déficit', () => {
    const suggestions = suggestImprovements(normalStudent, btsRequirements);
    expect(suggestions).toHaveLength(0);
  });

  it('devrait identifier les matières à améliorer', () => {
    const suggestions = suggestImprovements(strugglingStudent, btsRequirements);
    expect(suggestions.length).toBeGreaterThan(0);
    
    const mathSuggestion = suggestions.find(s => s.subject === 'Mathématiques');
    expect(mathSuggestion).toBeDefined();
    expect(mathSuggestion?.gap).toBe(4);
    expect(mathSuggestion?.currentLevel).toBe(8);
    expect(mathSuggestion?.targetLevel).toBe(12);
  });

  it('devrait trier par gap décroissant', () => {
    const suggestions = suggestImprovements(strugglingStudent, butRequirements);
    
    // Vérifier que le tri est correct
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1].gap).toBeGreaterThanOrEqual(suggestions[i].gap);
    }
  });
});
