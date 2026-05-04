/**
 * src/engine/types/userProfile.ts
 * 
 * Domain Model - UserProfile (Clean Architecture)
 * Représente l'état complet d'un utilisateur dans le système
 */

export interface UserProfile {
  // Identity
  id: string;
  name: string;
  
  // Academic Stats (0-20 scale, French system)
  stats: {
    math: number;
    french: number;
    science: number;
    average: number;
  };
  
  // Level Classification
  level: 'Débutant' | 'Moyen' | 'Avancé';
  
  // Optional: Extended attributes for future use
  metadata?: {
    money?: number; // Budget/Finances
    stress?: number; // Stress level (0-100)
    skills?: Record<string, number>; // Additional skills (JS, Python, etc.)
    achievements?: string[]; // Unlocked achievements
  };
}

/**
 * Requirements to access a node
 */
export interface NodeRequirements {
  math?: number;
  french?: number;
  science?: number;
  average?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

/**
 * Effects that can be applied to a user profile
 * (from events, node transitions, etc.)
 */
export interface ProfileEffect {
  // Stat modifications (additive)
  stats?: {
    math?: number;
    french?: number;
    science?: number;
    average?: number;
  };
  
  // Metadata modifications
  metadata?: {
    money?: number;
    stress?: number;
    skills?: Record<string, number>;
  };
  
  // Multiplicative modifiers (e.g., salary_modifier: 1.5 = +50%)
  modifiers?: {
    salary?: number;
    time?: number;
  };
}

/**
 * Factory: Create a new UserProfile with default values
 */
export function createUserProfile(
  id: string,
  name: string,
  stats: { math: number; french: number; science: number }
): UserProfile {
  const average = (stats.math + stats.french + stats.science) / 3;
  
  let level: 'Débutant' | 'Moyen' | 'Avancé' = 'Débutant';
  if (average >= 14) level = 'Avancé';
  else if (average >= 10) level = 'Moyen';
  
  return {
    id,
    name,
    stats: {
      ...stats,
      average: Math.round(average * 10) / 10
    },
    level,
    metadata: {
      money: 0,
      stress: 0,
      skills: {},
      achievements: []
    }
  };
}

/**
 * Helper: Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
