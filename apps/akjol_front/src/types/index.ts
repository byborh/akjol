/**
 * src/types/index.ts
 * Types globaux pour le projet AkJol
 */

export type NodeType = 'BAC' | 'ETUDE_SUP' | 'METIER' | 'CERTIF';

export interface Node {
  id: number;
  type: NodeType;
  title: string;
  slug: string;
  description: string;
  metadata: Record<string, any>;
  color?: string; // Gradient Tailwind: "from-blue-500 to-blue-600"
  icon?: string; // Emoji ou lucide-react name
  requirements?: NodeRequirements; // Conditions pour accéder à ce nœud
  schoolRequired?: boolean; // Si true, une école doit être sélectionnée pour valider l'étape
}

export interface School {
  id: number;
  name: string;
  city: string;
  node_id: number; // FK vers Node.id
  rating?: number; // Optionnel, ex: 4.2 / 5
}

export interface UserPathStep {
  node: Node;
  school: School;
}

export interface UserPath {
  steps: UserPathStep[];
}

export interface LifeSessionStats {
  wallet: number;
  stress: number;
  age: number;
}

export interface LifeSession {
  id: string; // uuid
  name: string;
  createdAt: number; // timestamp
  path: UserPathStep[];
  stats: LifeSessionStats;
  startingNodeId?: number | null;
}

export interface Edge {
  id: number;
  source_id: number;
  target_id: number;
  requirements: Record<string, any>;
}

/**
 * Configuration des requirements (conditions d'accès à un node)
 */
export interface NodeRequirements {
  math?: number; // Niveau minimum requis en maths (0-20)
  french?: number; // Français
  science?: number; // Sciences/Physique-Chimie
  average?: number; // Moyenne générale minimale
  difficulty?: 'Easy' | 'Medium' | 'Hard'; // Difficulté globale
}

/**
 * Stats utilisateur (profil étudiant)
 * Basé sur ses résultats actuels
 */
export interface UserStats {
  id: string;
  name: string;
  math: number; // 0-20
  french: number; // 0-20
  science: number; // 0-20
  average: number; // 0-20
  level: 'Débutant' | 'Moyen' | 'Avancé';
}

/**
 * État de la "Exploring Session"
 * Représente le chemin exploré par l'utilisateur
 */
export interface ExploreState {
  currentNodeId: number | null;
  path: UserPathStep[]; // Étapes validées (node + school)
  direction: 'left' | 'right'; // Pour l'animation
}

/**
 * Pour afficher les suggestions de chemins
 */
export interface PathwayStep {
  node: Node;
  requirements?: Record<string, any>;
  successProbability: number; // 0-1 (0% à 100%)
  riskLevel: 'safe' | 'medium' | 'risky'; // Basé sur la probabilité
}

/**
 * Event Aléatoire (RNG Event)
 * Déclenché lors des transitions entre nœuds
 */
export interface RandomEvent {
  id: number;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral'; // Type d'événement
  effect: EventEffect;
  probability: number; // 0-1 (probabilité de déclenchement)
  icon: string; // Emoji ou icône
  rarity: 'common' | 'rare' | 'epic' | 'legendary'; // Rareté
}

/**
 * Effet d'un événement sur les stats utilisateur
 */
export interface EventEffect {
  math?: number; // +/- points en maths
  french?: number; // +/- points en français
  science?: number; // +/- points en sciences
  average?: number; // +/- moyenne générale
  salary_modifier?: number; // Multiplicateur de salaire futur (0.8 = -20%, 1.2 = +20%)
  time_modifier?: number; // Accélère ou ralentit le temps (années)
  skill_boost?: number; // Bonus général à toutes les matières
  money?: number; // Gain ou perte d'argent (bourse, etc)
  stress?: number; // Impact sur le stress (futur)
}
