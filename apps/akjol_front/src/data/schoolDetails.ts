/**
 * Palliatif manuel en attendant la refonte data (cf. docs/data-architecture.md).
 *
 * Enrichit 10-15 écoles emblématiques avec leur adresse postale, contact et
 * coordonnées GPS. La clé est le slug produit par `slugifySchool(name, city)`.
 *
 * Les écoles non listées ici récupèrent les champs depuis les fixtures
 * `programs.ts` (websiteUrl, description) — sans adresse. Le composant
 * SchoolAddress affichera alors `addressUnknown` + lien vers le site officiel.
 *
 * Ne pas sur-investir : la refonte data apportera `schools.address` proprement
 * via l'Annuaire de l'éducation.
 */

export type SchoolDetail = {
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
};

export const SCHOOL_DETAILS: Record<string, SchoolDetail> = {
  // ── France ──────────────────────────────────────────────────────────
  "iut-paris-rives-de-seine-paris": {
    address: "143 avenue de Versailles",
    postalCode: "75016",
    city: "Paris",
    phone: "+33 1 76 53 47 00",
    email: "contact.iut@u-paris.fr",
    lat: 48.8462,
    lng: 2.2671,
  },
  "iut-de-villetaneuse-villetaneuse": {
    address: "99 avenue Jean-Baptiste Clément",
    postalCode: "93430",
    city: "Villetaneuse",
    phone: "+33 1 49 40 30 00",
    lat: 48.9572,
    lng: 2.3434,
  },
  "sorbonne-universite-paris": {
    address: "21 rue de l'École de Médecine",
    postalCode: "75006",
    city: "Paris",
    phone: "+33 1 40 46 22 11",
    email: "contact@sorbonne-universite.fr",
    lat: 48.8505,
    lng: 2.3437,
  },
  "ecole-normale-superieure-paris": {
    address: "45 rue d'Ulm",
    postalCode: "75005",
    city: "Paris",
    phone: "+33 1 44 32 30 00",
    email: "communication@ens.psl.eu",
    lat: 48.8418,
    lng: 2.3447,
  },
  "centralesupelec-gif-sur-yvette": {
    address: "3 rue Joliot-Curie",
    postalCode: "91190",
    city: "Gif-sur-Yvette",
    phone: "+33 1 75 31 60 00",
    email: "contact@centralesupelec.fr",
    lat: 48.7081,
    lng: 2.1991,
  },
  "universite-de-technologie-de-troyes-troyes": {
    address: "12 rue Marie Curie",
    postalCode: "10004",
    city: "Troyes",
    phone: "+33 3 25 71 76 00",
    email: "communication@utt.fr",
    lat: 48.2706,
    lng: 4.0680,
  },
  "sciences-po-paris": {
    address: "27 rue Saint-Guillaume",
    postalCode: "75007",
    city: "Paris",
    phone: "+33 1 45 49 50 50",
    email: "admissions@sciencespo.fr",
    lat: 48.8540,
    lng: 2.3290,
  },
  "hec-paris-jouy-en-josas": {
    address: "1 rue de la Libération",
    postalCode: "78350",
    city: "Jouy-en-Josas",
    phone: "+33 1 39 67 70 00",
    email: "info@hec.fr",
    lat: 48.7588,
    lng: 2.1707,
  },
  "polytech-nice-sophia-sophia-antipolis": {
    address: "930 route des Colles",
    postalCode: "06410",
    city: "Biot",
    phone: "+33 4 92 96 50 50",
    email: "polytech@univ-cotedazur.fr",
    lat: 43.6160,
    lng: 7.0691,
  },

  // ── Royaume-Uni ─────────────────────────────────────────────────────
  "university-of-manchester-manchester": {
    address: "Oxford Road",
    postalCode: "M13 9PL",
    city: "Manchester",
    phone: "+44 161 306 6000",
    email: "ug-admissions@manchester.ac.uk",
    lat: 53.4668,
    lng: -2.2339,
  },
  "imperial-college-london-london": {
    address: "Exhibition Road, South Kensington",
    postalCode: "SW7 2AZ",
    city: "London",
    phone: "+44 20 7589 5111",
    email: "registry@imperial.ac.uk",
    lat: 51.4988,
    lng: -0.1749,
  },

  // ── Allemagne ───────────────────────────────────────────────────────
  "technische-universitat-munchen-munich": {
    address: "Arcisstraße 21",
    postalCode: "80333",
    city: "München",
    phone: "+49 89 289 01",
    email: "presse@tum.de",
    lat: 48.1497,
    lng: 11.5681,
  },

  // ── Singapour ───────────────────────────────────────────────────────
  "national-university-of-singapore-singapore": {
    address: "21 Lower Kent Ridge Road",
    postalCode: "119077",
    city: "Singapore",
    phone: "+65 6516 6666",
    email: "askadm@nus.edu.sg",
    lat: 1.2966,
    lng: 103.7764,
  },
};

export function findSchoolDetail(slug: string): SchoolDetail | undefined {
  return SCHOOL_DETAILS[slug];
}
