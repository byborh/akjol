/**
 * src/data/eventsData.ts
 * 
 * Base de données (simulée) des événements aléatoires
 * Inspiré des systèmes de jeux roguelike (Slay the Spire, Hades, etc)
 */

import type { RandomEvent } from '../types';

/**
 * TABLE: EVENTS
 * Liste complète des événements possibles lors des transitions
 */
export const EVENTS: RandomEvent[] = [
  // ========== ÉVÉNEMENTS POSITIFS ==========
  {
    id: 1,
    title: 'Mentorat Inattendu 🌟',
    description:
      'Un ancien étudiant de ton école te propose de te guider gratuitement. Tu gagnes +2 points dans toutes les matières !',
    type: 'positive',
    effect: {
      skill_boost: 2 // +2 sur toutes les stats
    },
    probability: 0.08,
    icon: '🧙‍♂️',
    rarity: 'rare'
  },
  {
    id: 2,
    title: 'Bourse d\'Excellence 💰',
    description:
      'Tu reçois une bourse d\'études exceptionnelle. Tu peux te concentrer à 100% sur tes études sans stress financier.',
    type: 'positive',
    effect: {
      money: 5000,
      stress: -10,
      average: 1
    },
    probability: 0.05,
    icon: '💸',
    rarity: 'epic'
  },
  {
    id: 3,
    title: 'Hackathon Victory 🏆',
    description:
      'Tu remportes un hackathon national ! Ta réputation monte en flèche. +3 en Maths et Sciences.',
    type: 'positive',
    effect: {
      math: 3,
      science: 3,
      money: 2000
    },
    probability: 0.06,
    icon: '🥇',
    rarity: 'rare'
  },
  {
    id: 4,
    title: 'Projet Personnel Viral 🚀',
    description:
      'Un side-project que tu as créé devient viral sur GitHub. Les recruteurs t\'ajoutent sur LinkedIn.',
    type: 'positive',
    effect: {
      math: 2,
      average: 1.5
    },
    probability: 0.1,
    icon: '⭐',
    rarity: 'common'
  },
  {
    id: 5,
    title: 'Prof Inspirant ✨',
    description:
      'Tu tombes sur un prof extraordinaire qui te fait aimer une matière que tu détestais. +2 en Français.',
    type: 'positive',
    effect: {
      french: 2
    },
    probability: 0.12,
    icon: '👨‍🏫',
    rarity: 'common'
  },

  // ========== ÉVÉNEMENTS NÉGATIFS ==========
  {
    id: 10,
    title: 'Crise du Secteur Tech 📉',
    description:
      'Une crise économique frappe le secteur tech. Les salaires à la sortie sont réduits de 20%.',
    type: 'negative',
    effect: {
      salary_modifier: 0.8
    },
    probability: 0.05,
    icon: '📊',
    rarity: 'rare'
  },
  {
    id: 11,
    title: 'Burnout Étudiant 😰',
    description:
      'Le stress s\'accumule. Tu perds -1 point dans toutes tes matières à cause de la fatigue.',
    type: 'negative',
    effect: {
      skill_boost: -1,
      stress: 20
    },
    probability: 0.08,
    icon: '🔥',
    rarity: 'common'
  },
  {
    id: 12,
    title: 'Problème de Santé 🏥',
    description:
      'Un souci de santé te force à manquer des cours. -2 en Maths et Sciences.',
    type: 'negative',
    effect: {
      math: -2,
      science: -2,
      money: -500
    },
    probability: 0.07,
    icon: '💊',
    rarity: 'common'
  },
  {
    id: 13,
    title: 'Grève des Transports 🚇',
    description:
      'Une grève interminable t\'empêche d\'aller en cours régulièrement. -1 en moyenne générale.',
    type: 'negative',
    effect: {
      average: -1
    },
    probability: 0.1,
    icon: '🚫',
    rarity: 'common'
  },
  {
    id: 14,
    title: 'PC en Panne 💻',
    description:
      'Ton ordinateur lâche en plein milieu du semestre. -1 en Maths (codage impossible).',
    type: 'negative',
    effect: {
      math: -1,
      money: -800
    },
    probability: 0.09,
    icon: '⚡',
    rarity: 'common'
  },

  // ========== ÉVÉNEMENTS NEUTRES / MIXTES ==========
  {
    id: 20,
    title: 'Stage Intensif ⚙️',
    description:
      'Tu décroches un stage très formateur mais épuisant. +2 Maths, -1 Français (pas le temps de lire).',
    type: 'neutral',
    effect: {
      math: 2,
      french: -1,
      money: 1200
    },
    probability: 0.1,
    icon: '🏢',
    rarity: 'common'
  },
  {
    id: 21,
    title: 'Reconversion de Prof 🔄',
    description:
      'Ton prof principal change de carrière en plein semestre. Le nouveau est moins bon. -0.5 en Maths.',
    type: 'neutral',
    effect: {
      math: -0.5
    },
    probability: 0.08,
    icon: '👤',
    rarity: 'common'
  },
  {
    id: 22,
    title: 'Nouveau Camarade Génial 👥',
    description:
      'Tu te lies d\'amitié avec un étudiant brillant. Vous vous aidez mutuellement. +1 partout.',
    type: 'positive',
    effect: {
      skill_boost: 1
    },
    probability: 0.15,
    icon: '🤝',
    rarity: 'common'
  },

  // ========== ÉVÉNEMENTS LÉGENDAIRES (Très Rares) ==========
  {
    id: 30,
    title: 'Offre de FAANG 🦄',
    description:
      'Google te propose un stage avant même ta diplomation ! Salaire boosté de +50% à vie.',
    type: 'positive',
    effect: {
      salary_modifier: 1.5,
      skill_boost: 3,
      money: 10000
    },
    probability: 0.01,
    icon: '🚀',
    rarity: 'legendary'
  },
  {
    id: 31,
    title: 'Pandémie Mondiale 🦠',
    description:
      'Une pandémie force les écoles à passer en distanciel. Qualité des cours en chute. -2 partout.',
    type: 'negative',
    effect: {
      skill_boost: -2,
      stress: 30
    },
    probability: 0.02,
    icon: '😷',
    rarity: 'legendary'
  }
];

/**
 * Récupère un événement par son ID
 */
export function getEventById(id: number): RandomEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

/**
 * Récupère tous les événements d'un certain type
 */
export function getEventsByType(type: 'positive' | 'negative' | 'neutral'): RandomEvent[] {
  return EVENTS.filter((e) => e.type === type);
}

/**
 * Récupère tous les événements d'une certaine rareté
 */
export function getEventsByRarity(
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
): RandomEvent[] {
  return EVENTS.filter((e) => e.rarity === rarity);
}
