/**
 * src/engine/rules/index.ts
 * 
 * Barrel Export - Business Rules
 * Point d'entrée unique pour toutes les règles métier
 */

// Access Rules
export {
  canAccessNode,
  calculateRequirementGaps,
  calculateDifficultyLevel,
  suggestImprovements
} from './accessRules';

// Outcome Rules
export {
  calculateOutcome,
  applyGlobalBoost,
  simulateGrowthOverTime,
  applySalaryModifier,
  calculateReadinessScore
} from './outcomeRules';

// Probability Rules
export {
  calculateSuccessProbability,
  calculateFutureProbability
} from './probabilityRules';

// Types
export type { ProbabilityResult } from './probabilityRules';
export type { UserProfile, NodeRequirements, ProfileEffect } from '../types/userProfile';
