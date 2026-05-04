/**
 * src/services/apiService.ts
 * 
 * Service pour récupérer les données réelles des APIs publiques ONISEP
 * Remplace les données mockées statiques
 */

/**
 * Interface pour les données brutes de formation depuis ONISEP
 */
interface RawFormation {
  libelle_formation_principal: string;
  libelle_type_formation: string;
  duree: string;
  niveau_de_sortie_indicatif: string;
  domainesous_domaine?: string;
  sigle_type_formation?: string;
  [key: string]: any;
}

/**
 * Interface pour les données brutes d'établissement depuis ONISEP
 */
interface RawEtablissement {
  nom?: string;
  name?: string;
  commune?: string;
  city?: string;
  civilite?: string;
  [key: string]: any;
}

/**
 * Récupère les formations depuis l'API publique ONISEP
 * URL: https://www.data.gouv.fr/api/1/datasets/r/8f3f725b-6c15-4450-85cd-bdeaf6eca358
 * 
 * @returns Promise<RawFormation[]> - Tableau des formations brutes
 */
export async function fetchFormationsFromAPI(): Promise<RawFormation[]> {
  try {
    const response = await fetch(
      '/api/onisep/5fa591127f501/5fa591127f501.json'
    );
    
    if (!response.ok) {
      throw new Error(`Erreur API formations: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${data.length || 0} formations récupérées depuis ONISEP`);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors du fetch des formations:', error);
    throw error;
  }
}

/**
 * Récupère les établissements depuis l'API publique ONISEP
 * URL: https://www.data.gouv.fr/api/1/datasets/r/bb928414-d7dc-4aa5-bd47-22eab158774d
 * 
 * @returns Promise<RawEtablissement[]> - Tableau des établissements bruts
 */
export async function fetchEtablissementsFromAPI(): Promise<RawEtablissement[]> {
  try {
    const response = await fetch(
      '/api/onisep/5fa586da5c4b6/5fa586da5c4b6.json'
    );
    
    if (!response.ok) {
      throw new Error(`Erreur API établissements: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${data.length || 0} établissements récupérés depuis ONISEP`);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors du fetch des établissements:', error);
    throw error;
  }
}

/**
 * Récupère TOUTES les données (formations + établissements) de manière optimisée
 * Utilise Promise.all pour paralléliser les requêtes
 * 
 * @returns Promise contenant formations et établissements
 */
export async function fetchAllDataFromAPIs() {
  try {
    const [formations, etablissements] = await Promise.all([
      fetchFormationsFromAPI(),
      fetchEtablissementsFromAPI()
    ]);
    
    return { formations, etablissements };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error);
    throw error;
  }
}
