/**
 * src/services/dataMapper.ts
 * 
 * Convertit les données brutes des APIs ONISEP 
 * vers les interfaces Node et School utilisées dans l'application
 */

import type { Node, School } from '../types';

/**
 * Mappe une formation brute ONISEP vers l'interface Node
 * 
 * @param raw - Données brutes de la formation depuis ONISEP
 * @param id - ID unique attribué au nœud
 * @returns Node - Formation mappée
 */
export function mapRawFormationToNode(raw: any, id: number): Node {
  // Extraire les informations de base
  const title = raw.libelle_formation_principal || 'Formation sans titre';
  
  // Créer un slug à partir du titre (simplifié)
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);

  // Déterminer le type de formation
  const typeLibelle = raw.libelle_type_formation || '';
  const type = determineNodeType(typeLibelle);

  // Extraire la durée
  const duration = extractDuration(raw.duree);
  
  // Déterminer la difficulté selon le type
  const difficulty = determineDifficulty(typeLibelle, raw.niveau_de_sortie_indicatif);
  
  // Assigner une couleur selon le type
  const color = getColorByType(type);
  
  // Assigner une icône selon le type
  const icon = getIconByType(type);

  // Construire les métadonnées
  const metadata = {
    type_official: typeLibelle,
    duration: duration,
    level: raw.niveau_de_sortie_indicatif || 'Non spécifié',
    domains: parseDomains(raw.domainesous_domaine),
    code_sceance: raw.code_scolarite || null,
  };

  // Construire les requirements (conditions d'accès)
  const requirements = {
    difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
    math: difficulty === 'Hard' ? 12 : difficulty === 'Medium' ? 10 : 8,
    science: difficulty === 'Hard' ? 12 : difficulty === 'Medium' ? 10 : 8,
    average: difficulty === 'Hard' ? 12 : difficulty === 'Medium' ? 10 : 8,
  };

  return {
    id,
    type,
    title,
    slug,
    description: title, // Utiliser le titre comme description basique
    metadata,
    color,
    icon,
    requirements,
    schoolRequired: type !== 'BAC', // École obligatoire sauf pour le BAC
  };
}

/**
 * Mappe un établissement brut ONISEP vers l'interface School
 * 
 * @param raw - Données brutes d'établissement depuis ONISEP
 * @param id - ID unique attribué à l'école
 * @param nodeId - ID du nœud (formation) associé
 * @returns School - Établissement mappé
 */
export function mapRawEtablissementToSchool(
  raw: any,
  id: number,
  nodeId: number
): School {
  const name = raw.nom || raw.name || 'Établissement sans nom';
  const city = raw.commune || raw.city || 'Ville non spécifiée';

  return {
    id,
    name,
    city,
    node_id: nodeId,
    rating: generateRandomRating(), // Ou à récupérer si disponible
  };
}

/**
 * Détermine le type de nœud (BAC, ETUDE_SUP, METIER, CERTIF) 
 * selon le libellé de type de formation
 */
function determineNodeType(typeLibelle: string): 'BAC' | 'ETUDE_SUP' | 'METIER' | 'CERTIF' {
  const lower = typeLibelle.toLowerCase();

  // BAC
  if (lower.includes('baccalaur') || lower.includes('bac ')) {
    return 'BAC';
  }

  // CERTIF (certifications, diplômes courtes)
  if (
    lower.includes('certificat') ||
    lower.includes('cap ') ||
    lower.includes('ctm') ||
    lower.includes('fcil')
  ) {
    return 'CERTIF';
  }

  // METIER (formations courtes, professionnelles)
  if (
    lower.includes('professionnel') ||
    lower.includes('titre ') ||
    lower.includes('master professionnel')
  ) {
    return 'METIER';
  }

  // ETUDE_SUP (par défaut pour le reste: masters, licences, BTS, BUT, etc.)
  return 'ETUDE_SUP';
}

/**
 * Détermine la difficulté selon le libellé et le niveau de sortie
 */
function determineDifficulty(
  typeLibelle: string,
  niveauSortie: string | undefined
): 'Easy' | 'Medium' | 'Hard' {
  const type = typeLibelle.toLowerCase();
  const niveau = (niveauSortie || '').toLowerCase();

  // Baccalauréat = Moyen
  if (type.includes('baccalaur')) {
    return 'Medium';
  }

  // CAP/BEP = Easy
  if (type.includes('cap') || type.includes('bep')) {
    return 'Easy';
  }

  // Niveaux bac+5 et plus = Hard
  if (
    niveau.includes('bac + 5') ||
    niveau.includes('bac + 6') ||
    niveau.includes('bac + 7')
  ) {
    return 'Hard';
  }

  // Niveaux bac+2 à bac+4 = Medium
  if (
    niveau.includes('bac +') && 
    (niveau.includes('bac + 2') || 
     niveau.includes('bac + 3') || 
     niveau.includes('bac + 4'))
  ) {
    return 'Medium';
  }

  // Par défaut
  return 'Medium';
}

/**
 * Détermine la couleur du gradient Tailwind selon le type de formation
 */
function getColorByType(type: 'BAC' | 'ETUDE_SUP' | 'METIER' | 'CERTIF'): string {
  switch (type) {
    case 'BAC':
      return 'from-blue-500 to-blue-600';
    case 'ETUDE_SUP':
      return 'from-purple-500 to-purple-600';
    case 'METIER':
      return 'from-orange-500 to-orange-600';
    case 'CERTIF':
      return 'from-green-500 to-green-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
}

/**
 * Détermine l'icône emoji selon le type de formation
 */
function getIconByType(type: 'BAC' | 'ETUDE_SUP' | 'METIER' | 'CERTIF'): string {
  switch (type) {
    case 'BAC':
      return '🎓';
    case 'ETUDE_SUP':
      return '📚';
    case 'METIER':
      return '💼';
    case 'CERTIF':
      return '✅';
    default:
      return '📖';
  }
}

/**
 * Extrait la durée en années depuis la chaîne de texte
 */
function extractDuration(dureeStr: string | undefined): number {
  if (!dureeStr) return 2; // Défaut: 2 ans

  const match = dureeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2;
}

/**
 * Parse les domaines (séparés par " | ")
 */
function parseDomains(domainesStr: string | undefined): string[] {
  if (!domainesStr) return [];
  
  return domainesStr
    .split('|')
    .map(d => d.trim())
    .filter(d => d.length > 0)
    .slice(0, 3); // Limiter à 3 domaines
}

/**
 * Génère une note aléatoire (simulation)
 * À remplacer par des données réelles si disponibles
 */
function generateRandomRating(): number {
  return Math.round((Math.random() * 2 + 3) * 10) / 10; // Entre 3.0 et 5.0
}
