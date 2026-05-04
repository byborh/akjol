/**
 * src/data/mockData.ts
 * 
 * GRAPH RELATIONAL MODEL
 * Reproduit la structure PostgreSQL en JSON
 * - Nodes : Tous les points du graphe (Bacs, Études, Métiers)
 * - Edges : Les connexions possibles entre nœuds
 * - Metadata JSONB : Flexibilité complète par type
 */

import type { Node, Edge, UserStats, School } from '../types';

// ==================== NODES DATA ====================
export const NODES: Node[] = [
  // --- LEVEL 0 : BAC (Point de départ) ---
  {
    id: 1,
    type: 'BAC',
    title: 'Bac Général (Spé Math/NSI)',
    slug: 'bac-general-nsi',
    description: 'Baccalauréat général avec spécialités scientifiques. Accès à pratiquement tout post-bac.',
    metadata: { difficulty: 'High', duration: '3 years', specialty: ['Maths', 'NSI'] },
    color: 'from-blue-500 to-blue-600',
    icon: '🎓',
    schoolRequired: true
  },
  {
    id: 2,
    type: 'BAC',
    title: 'Bac STI2D',
    slug: 'bac-sti2d',
    description: 'Sciences et Technologies de l\'Industrie et du Développement Durable.',
    metadata: { difficulty: 'Medium', duration: '3 years', specialty: ['SIN', 'EE'] },
    color: 'from-orange-500 to-orange-600',
    icon: '⚙️',
    schoolRequired: true
  },
  {
    id: 3,
    type: 'BAC',
    title: 'Bac Pro SN (CIEL)',
    slug: 'bac-pro-sn',
    description: 'Systèmes Numériques / Cybersécurité. Formation directement professionnelle.',
    metadata: { difficulty: 'Medium', duration: '3 years', alternance: true },
    color: 'from-red-500 to-red-600',
    icon: '🔧',
    schoolRequired: true
  },

  // --- LEVEL 1 : ÉTUDES SUPÉRIEURES (BAC+2/3) ---
  {
    id: 10,
    type: 'ETUDE_SUP',
    title: 'BTS SIO - Option SISR',
    slug: 'bts-sio-sisr',
    description: 'Solutions d\'infrastructure, systèmes et réseaux. 2 ans, très professionnel.',
    metadata: {
      years: 2,
      category: 'Technique',
      alternance_possible: true,
      avg_salary_junior: 28000,
      job_fit: ['Administrateur Réseaux', 'Support Informatique']
    },
    requirements: {
      math: 11,
      science: 10,
      average: 11,
      difficulty: 'Medium'
    },
    color: 'from-green-400 to-green-500',
    icon: '🌐',
    schoolRequired: true
  },
  {
    id: 11,
    type: 'ETUDE_SUP',
    title: 'BTS SIO - Option SLAM',
    slug: 'bts-sio-slam',
    description: 'Solutions Logicielles et Applications Métiers (Dev). 2 ans, très demandé.',
    metadata: {
      years: 2,
      category: 'Technique',
      alternance_possible: true,
      avg_salary_junior: 32000,
      job_fit: ['Développeur Web', 'Développeur Fullstack', 'Dev Mobile']
    },
    requirements: {
      math: 12,
      science: 11,
      average: 12,
      difficulty: 'Medium'
    },
    color: 'from-purple-400 to-purple-500',
    icon: '💻',
    schoolRequired: true
  },
  {
    id: 12,
    type: 'ETUDE_SUP',
    title: 'BUT Informatique',
    slug: 'but-info',
    description: 'Bachelor Universitaire de Technologie en 3 ans. Plus théorique que BTS.',
    metadata: {
      years: 3,
      category: 'Universitaire',
      theory_level: 'High',
      avg_salary_junior: 30000,
      job_fit: ['Développeur', 'Chef de Projet']
    },
    requirements: {
      math: 13,
      science: 12,
      average: 13,
      difficulty: 'Medium'
    },
    color: 'from-indigo-400 to-indigo-500',
    icon: '📚',
    schoolRequired: true
  },
  {
    id: 13,
    type: 'ETUDE_SUP',
    title: 'École 42 / Piscine',
    slug: 'ecole-42',
    description: 'Formation intensive sans profs. Gratuit, très intensif, très demandé.',
    metadata: {
      years: 88,
      category: 'Privé',
      price: 'Gratuit',
      intensity: 'Très Haut',
      avg_salary_junior: 35000,
      job_fit: ['Développeur Web', 'Startup Cofounder']
    },
    requirements: {
      math: 10,
      average: 10,
      difficulty: 'Hard'
    },
    color: 'from-pink-400 to-pink-500',
    icon: '🚀',
    schoolRequired: true
  },

  // --- LEVEL 2 : POURSUITE D'ÉTUDES (BAC+3/5) ---
  {
    id: 20,
    type: 'ETUDE_SUP',
    title: 'Licence Pro - Métiers de l\'Informatique',
    slug: 'licence-pro-dev',
    description: 'Spécialisation en 1 an après un BAC+2. Diplôme très opérationnel.',
    metadata: {
      years: 1,
      category: 'Universitaire',
      level: 'BAC+3',
      avg_salary_junior: 33000,
      job_fit: ['Développeur Senior', 'Tech Lead']
    },
    requirements: {
      math: 12,
      average: 12,
      difficulty: 'Medium'
    },
    color: 'from-cyan-400 to-cyan-500',
    icon: '🎯',
    schoolRequired: true
  },
  {
    id: 21,
    type: 'ETUDE_SUP',
    title: 'Master Expert Informatique',
    slug: 'master-expert-info',
    description: 'Diplôme niveau BAC+5. Pour ceux qui veulent progresser vers lead/manager.',
    metadata: {
      years: 2,
      category: 'Universitaire',
      level: 'BAC+5',
      avg_salary_junior: 38000,
      job_fit: ['Chef de Projet', 'Architect', 'CTO']
    },
    requirements: {
      math: 14,
      science: 13,
      average: 14,
      difficulty: 'Hard'
    },
    color: 'from-rose-400 to-rose-500',
    icon: '👑',
    schoolRequired: true
  },

  // --- LEVEL 3 : MÉTIERS (BUT ULTIME) ---
  {
    id: 30,
    type: 'METIER',
    title: 'Développeur Fullstack JS',
    slug: 'dev-fullstack',
    description: 'Création de sites web (Front & Back). Le classique qui marche.',
    metadata: {
      salary_junior: 38000,
      salary_senior: 55000,
      remote: true,
      demand: 'Very High',
      technologies: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
      stress_level: 'Medium'
    },
    requirements: {
      math: 11,
      average: 11,
      difficulty: 'Medium'
    },
    color: 'from-yellow-400 to-yellow-500',
    icon: '🚀',
    schoolRequired: true
  },
  {
    id: 31,
    type: 'METIER',
    title: 'Administrateur Réseaux / Sys',
    slug: 'admin-sys-res',
    description: 'Gestion des parcs informatiques et serveurs. Très demandé en entreprise.',
    metadata: {
      salary_junior: 32000,
      salary_senior: 48000,
      remote: false,
      demand: 'High',
      technologies: ['Linux', 'Windows Server', 'Networking', 'Cloud'],
      stress_level: 'High'
    },
    requirements: {
      math: 10,
      science: 10,
      average: 10,
      difficulty: 'Medium'
    },
    color: 'from-teal-400 to-teal-500',
    icon: '🛡️',
    schoolRequired: true
  }
];

// ==================== SCHOOLS DATA ====================
export const SCHOOLS: School[] = [
  { id: 1001, name: 'Lycée Voltaire', city: 'Paris', node_id: 1, rating: 4.3 },
  { id: 1002, name: 'Lycée Montaigne', city: 'Bordeaux', node_id: 1, rating: 4.1 },
  { id: 1003, name: 'Lycée Jean Perrin', city: 'Lyon', node_id: 1, rating: 4.2 },

  { id: 1004, name: 'Lycée Gustave Eiffel', city: 'Dijon', node_id: 2, rating: 4.0 },
  { id: 1005, name: 'Lycée Blaise Pascal', city: 'Clermont-Ferrand', node_id: 2, rating: 3.9 },
  { id: 1006, name: 'Lycée Jules Verne', city: 'Nantes', node_id: 2, rating: 4.1 },

  { id: 1007, name: 'Lycée Louis Armand', city: 'Poitiers', node_id: 3, rating: 3.8 },
  { id: 1008, name: 'Lycée René Cassin', city: 'Bayonne', node_id: 3, rating: 3.9 },
  { id: 1009, name: 'Lycée Victor Hugo', city: 'Besançon', node_id: 3, rating: 4.0 },

  { id: 1010, name: 'Campus Tech Atlantique', city: 'Rennes', node_id: 10, rating: 4.2 },
  { id: 1011, name: 'Institut Réseaux Sud', city: 'Montpellier', node_id: 10, rating: 4.1 },
  { id: 1012, name: 'Sup Infra Lille', city: 'Lille', node_id: 10, rating: 4.3 },

  { id: 1013, name: 'Académie Dev Paris', city: 'Paris', node_id: 11, rating: 4.4 },
  { id: 1014, name: 'SupCode Lyon', city: 'Lyon', node_id: 11, rating: 4.2 },
  { id: 1015, name: 'Institut Numérique Nice', city: 'Nice', node_id: 11, rating: 4.1 },

  { id: 1016, name: 'IUT Informatique Toulouse', city: 'Toulouse', node_id: 12, rating: 4.3 },
  { id: 1017, name: 'IUT Grenoble Alpes', city: 'Grenoble', node_id: 12, rating: 4.4 },
  { id: 1018, name: 'IUT Strasbourg Tech', city: 'Strasbourg', node_id: 12, rating: 4.2 },

  { id: 1019, name: '42 Paris', city: 'Paris', node_id: 13, rating: 4.7 },
  { id: 1020, name: '42 Lyon AuRA', city: 'Lyon', node_id: 13, rating: 4.6 },
  { id: 1021, name: '42 Nice Côte d’Azur', city: 'Nice', node_id: 13, rating: 4.5 },

  { id: 1022, name: 'Université Numéria', city: 'Angers', node_id: 20, rating: 4.1 },
  { id: 1023, name: 'Campus Pro Dev', city: 'Rouen', node_id: 20, rating: 4.0 },
  { id: 1024, name: 'Fac Sciences Appliquées', city: 'Caen', node_id: 20, rating: 3.9 },

  { id: 1025, name: 'MasterTech Sorbonne', city: 'Paris', node_id: 21, rating: 4.6 },
  { id: 1026, name: 'Expert School Marseille', city: 'Marseille', node_id: 21, rating: 4.3 },
  { id: 1027, name: 'Digital Graduate Lille', city: 'Lille', node_id: 21, rating: 4.4 },

  { id: 1028, name: 'Bootcamp Fullstack One', city: 'Nantes', node_id: 30, rating: 4.2 },
  { id: 1029, name: 'Factory JS Pro', city: 'Bordeaux', node_id: 30, rating: 4.1 },
  { id: 1030, name: 'École Web Horizon', city: 'Paris', node_id: 30, rating: 4.3 },

  { id: 1031, name: 'Institut Réseau Europe', city: 'Lyon', node_id: 31, rating: 4.0 },
  { id: 1032, name: 'SysAdmin Academy', city: 'Toulouse', node_id: 31, rating: 4.1 },
  { id: 1033, name: 'Campus Infra Ouest', city: 'Rennes', node_id: 31, rating: 3.9 }
];

// ==================== EDGES DATA ====================
export const EDGES: Edge[] = [
  // Depuis BAC vers BTS/BUT/42
  { id: 1, source_id: 1, target_id: 12, requirements: { mention: 'Bien' } },
  { id: 2, source_id: 2, target_id: 10, requirements: {} },
  { id: 3, source_id: 2, target_id: 11, requirements: {} },
  { id: 4, source_id: 3, target_id: 10, requirements: { dossier: 'Excellent' } },
  { id: 5, source_id: 1, target_id: 13, requirements: {} },
  { id: 6, source_id: 1, target_id: 11, requirements: {} },

  // Depuis BTS vers Licence/Master/Job
  { id: 7, source_id: 11, target_id: 20, requirements: {} },
  {
    id: 8,
    source_id: 11,
    target_id: 30,
    requirements: { portfolio: 'Recommendé', alternance: 'Plus facile' }
  },
  { id: 9, source_id: 10, target_id: 31, requirements: {} },
  { id: 10, source_id: 13, target_id: 30, requirements: { project: 'Requis' } },

  // Depuis Licence vers Job/Master
  { id: 11, source_id: 20, target_id: 30, requirements: {} },
  { id: 12, source_id: 20, target_id: 21, requirements: {} },
  { id: 13, source_id: 12, target_id: 20, requirements: {} },
  { id: 14, source_id: 12, target_id: 30, requirements: {} },

  // Depuis Master vers Jobs Senior
  { id: 15, source_id: 21, target_id: 30, requirements: { senior: true } }
];

// ==================== UTILITY FUNCTIONS ====================
/**
 * Récupère tous les chemins possibles depuis un nœud
 */
export function getNextPathways(nodeId: number): Node[] {
  const edges = EDGES.filter((edge) => edge.source_id === nodeId);
  return edges
    .map((edge) => NODES.find((n) => n.id === edge.target_id))
    .filter((node) => node !== undefined) as Node[];
}

/**
 * Récupère les conditions pour passer de A à B
 */
export function getEdgeRequirements(sourceId: number, targetId: number) {
  return EDGES.find((e) => e.source_id === sourceId && e.target_id === targetId)?.requirements || {};
}

/**
 * Récupère les établissements associés à un nœud
 */
export function getSchoolsByNodeId(nodeId: number): School[] {
  return SCHOOLS.filter((school) => school.node_id === nodeId);
}

// Pour backward compat avec App.tsx existant
export const DATA_NODES = NODES;

// ==================== USER STATS DATA ====================
/**
 * Profil utilisateur exemple
 * En production, ce serait chargé depuis une API backend
 * Stats actuelles d'un étudiant lycéen
 */
export const MOCK_USER_STATS: UserStats = {
  id: 'user-001',
  name: 'Alexandre Dupont',
  math: 14, // Bon en maths
  french: 13, // Moyen en français
  science: 12, // Moyen en sciences
  average: 13, // Moyenne générale 13/20
  level: 'Avancé'
};