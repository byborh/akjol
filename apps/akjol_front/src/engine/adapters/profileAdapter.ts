/**
 * src/engine/adapters/profileAdapter.ts
 * 
 * Adapter Layer - Bridge between legacy types and Clean Architecture
 * Permet de migrer progressivement sans casser le code existant
 */

import type { UserStats } from '../../types';
import type { UserProfile, ProfileEffect } from '../types/userProfile';
import type { EventEffect } from '../../types';

/**
 * Convertit UserStats (legacy) en UserProfile (Clean Architecture)
 */
export function userStatsToProfile(stats: UserStats): UserProfile {
  return {
    id: stats.id,
    name: stats.name,
    stats: {
      math: stats.math,
      french: stats.french,
      science: stats.science,
      average: stats.average
    },
    level: stats.level,
    metadata: {
      money: 0,
      stress: 0,
      skills: {},
      achievements: []
    }
  };
}

/**
 * Convertit UserProfile en UserStats (legacy)
 */
export function profileToUserStats(profile: UserProfile): UserStats {
  return {
    id: profile.id,
    name: profile.name,
    math: profile.stats.math,
    french: profile.stats.french,
    science: profile.stats.science,
    average: profile.stats.average,
    level: profile.level
  };
}

/**
 * Convertit EventEffect (legacy) en ProfileEffect (Clean Architecture)
 */
export function eventEffectToProfileEffect(effect: EventEffect): ProfileEffect {
  return {
    stats: {
      math: effect.math,
      french: effect.french,
      science: effect.science,
      average: effect.average
    },
    metadata: {
      money: effect.money,
      stress: effect.stress,
      skills: effect.skill_boost ? { skill_boost: effect.skill_boost } : undefined
    },
    modifiers: {
      salary: effect.salary_modifier,
      time: effect.time_modifier
    }
  };
}
