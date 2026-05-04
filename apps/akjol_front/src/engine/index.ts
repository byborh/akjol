/**
 * src/engine/index.ts
 * 
 * Main Barrel Export - Clean Architecture Engine
 * Point d'entrée principal pour importer toutes les règles métier
 */

// ========================================
// RÈGLES MÉTIER (Business Rules)
// ========================================

export {
  // Access Rules
  canAccessNode,
  calculateRequirementGaps,
  calculateDifficultyLevel,
  suggestImprovements,
  
  // Outcome Rules
  calculateOutcome,
  applyGlobalBoost,
  simulateGrowthOverTime,
  applySalaryModifier,
  calculateReadinessScore,
  
  // Probability Rules
  calculateSuccessProbability,
  calculateFutureProbability
} from './rules';

// ========================================
// TYPES (Domain Models)
// ========================================

export type {
  UserProfile,
  NodeRequirements,
  ProfileEffect
} from './types/userProfile';

export type {
  ProbabilityResult
} from './rules/probabilityRules';

// ========================================
// ADAPTERS (Legacy Bridge)
// ========================================

export {
  userStatsToProfile,
  profileToUserStats,
  eventEffectToProfileEffect
} from './adapters/profileAdapter';

// ========================================
// UTILITIES
// ========================================

export {
  clamp,
  createUserProfile
} from './types/userProfile';
