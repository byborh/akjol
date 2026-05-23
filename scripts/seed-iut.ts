/**
 * Seed 30 IUT français qui proposent le BUT Informatique.
 *
 * Pourquoi ce script existe : l'Annuaire de l'Éducation (data.education.gouv.fr)
 * ne contient pas les IUT (gérés par le ministère de l'Enseignement Supérieur,
 * pas l'Éducation Nationale). Le dataset MESR `fr-esr-principaux-etablissements`
 * liste les universités mais pas leurs composantes (IUT, UFR…). Résultat : sans
 * ce seed, l'autocomplete école dans l'Admin échoue pour les 30 BUT Info qu'on
 * va curer.
 *
 * Convention UAI provisoire : "9990001I" → "9990030I" (préfixe 999 = "à
 * valider"). À remplacer par les vrais codes UAI le jour où on a un dataset
 * MESR composantes propre. Le format respecte le pattern Zod officiel
 * (^\d{7}[A-Z]$) pour rester compatible avec la validation Admin.
 *
 * lat/lng : coordonnées approximatives par ville (centroïde campus). Précision
 * volontairement grossière — on refinera quand on aura les adresses exactes.
 *
 * Idempotent : UPSERT par uai. Tu peux relancer sans crainte.
 *
 * Usage : pnpm seed:iut
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { sql } from "drizzle-orm";
import { createDb, schools, type SchoolInsert } from "@akjol/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

type IutSeed = {
  uai: string; // UAI provisoire (préfixe 999), à remplacer plus tard
  name: string;
  city: string;
  postalCode: string;
  region: string;
  lat: number; // degrés décimaux
  lng: number;
  websiteUrl: string | null;
};

const IUTS: IutSeed[] = [
  // ─────────── Île-de-France (6) ───────────
  { uai: "9990001I", name: "IUT Paris-Rives de Seine (Paris Cité)", city: "Paris", postalCode: "75013", region: "Île-de-France", lat: 48.8324, lng: 2.3826, websiteUrl: "https://www.iutparis-seine.u-paris.fr" },
  { uai: "9990002I", name: "IUT de Villetaneuse (Sorbonne Paris Nord)", city: "Villetaneuse", postalCode: "93430", region: "Île-de-France", lat: 48.9555, lng: 2.3413, websiteUrl: "https://iutv.univ-paris13.fr" },
  { uai: "9990003I", name: "IUT d'Orsay (Paris-Saclay)", city: "Orsay", postalCode: "91400", region: "Île-de-France", lat: 48.7020, lng: 2.1817, websiteUrl: "https://www.iut-orsay.universite-paris-saclay.fr" },
  { uai: "9990004I", name: "IUT de Vélizy (UVSQ)", city: "Vélizy-Villacoublay", postalCode: "78140", region: "Île-de-France", lat: 48.7827, lng: 2.1949, websiteUrl: "https://www.iut-velizy.uvsq.fr" },
  { uai: "9990005I", name: "IUT de Sceaux (Paris-Saclay)", city: "Sceaux", postalCode: "92330", region: "Île-de-France", lat: 48.7790, lng: 2.2945, websiteUrl: "https://www.iut-sceaux.universite-paris-saclay.fr" },
  { uai: "9990006I", name: "IUT de Marne-la-Vallée (Gustave Eiffel)", city: "Champs-sur-Marne", postalCode: "77420", region: "Île-de-France", lat: 48.8407, lng: 2.5860, websiteUrl: "https://www.iut.univ-eiffel.fr" },

  // ─────────── Auvergne-Rhône-Alpes (5) ───────────
  { uai: "9990007I", name: "IUT Lyon 1 (Université Claude Bernard)", city: "Villeurbanne", postalCode: "69100", region: "Auvergne-Rhône-Alpes", lat: 45.7821, lng: 4.8682, websiteUrl: "https://iut.univ-lyon1.fr" },
  { uai: "9990008I", name: "IUT Lumière Lyon 2", city: "Bron", postalCode: "69500", region: "Auvergne-Rhône-Alpes", lat: 45.7395, lng: 4.9145, websiteUrl: "https://iutlumiere.univ-lyon2.fr" },
  { uai: "9990009I", name: "IUT de Saint-Étienne (Jean Monnet)", city: "Saint-Étienne", postalCode: "42100", region: "Auvergne-Rhône-Alpes", lat: 45.4233, lng: 4.3927, websiteUrl: "https://iut.univ-st-etienne.fr" },
  { uai: "9990010I", name: "IUT 1 de Grenoble (UGA)", city: "Grenoble", postalCode: "38400", region: "Auvergne-Rhône-Alpes", lat: 45.1939, lng: 5.7656, websiteUrl: "https://iut1.univ-grenoble-alpes.fr" },
  { uai: "9990011I", name: "IUT de Clermont-Ferrand (UCA)", city: "Clermont-Ferrand", postalCode: "63170", region: "Auvergne-Rhône-Alpes", lat: 45.7595, lng: 3.1147, websiteUrl: "https://iut.uca.fr" },

  // ─────────── PACA + Occitanie (4) ───────────
  { uai: "9990012I", name: "IUT d'Aix-Marseille (AMU)", city: "Aix-en-Provence", postalCode: "13090", region: "Provence-Alpes-Côte d'Azur", lat: 43.5279, lng: 5.4400, websiteUrl: "https://iut.univ-amu.fr" },
  { uai: "9990013I", name: "IUT Nice Côte d'Azur", city: "Nice", postalCode: "06200", region: "Provence-Alpes-Côte d'Azur", lat: 43.6757, lng: 7.2056, websiteUrl: "https://unice.fr/iut" },
  { uai: "9990014I", name: "IUT 'A' Paul-Sabatier (Toulouse III)", city: "Toulouse", postalCode: "31077", region: "Occitanie", lat: 43.5618, lng: 1.4636, websiteUrl: "https://www.iut-tlse3.fr" },
  { uai: "9990015I", name: "IUT de Montpellier-Sète", city: "Montpellier", postalCode: "34296", region: "Occitanie", lat: 43.6342, lng: 3.8635, websiteUrl: "https://iut-montpellier-sete.edu.umontpellier.fr" },

  // ─────────── Nouvelle-Aquitaine (3) ───────────
  { uai: "9990016I", name: "IUT de Bordeaux", city: "Gradignan", postalCode: "33170", region: "Nouvelle-Aquitaine", lat: 44.7720, lng: -0.6203, websiteUrl: "https://www.iut.u-bordeaux.fr" },
  { uai: "9990017I", name: "IUT de Pau et Pays de l'Adour (UPPA)", city: "Pau", postalCode: "64000", region: "Nouvelle-Aquitaine", lat: 43.3110, lng: -0.3617, websiteUrl: "https://iutpaysdeladour.univ-pau.fr" },
  { uai: "9990018I", name: "IUT du Limousin", city: "Limoges", postalCode: "87065", region: "Nouvelle-Aquitaine", lat: 45.8336, lng: 1.2659, websiteUrl: "https://www.iut.unilim.fr" },

  // ─────────── Centre-Val de Loire + Pays de la Loire (3) ───────────
  { uai: "9990019I", name: "IUT de Tours", city: "Tours", postalCode: "37000", region: "Centre-Val de Loire", lat: 47.3650, lng: 0.6986, websiteUrl: "https://iut.univ-tours.fr" },
  { uai: "9990020I", name: "IUT d'Orléans", city: "Orléans", postalCode: "45067", region: "Centre-Val de Loire", lat: 47.8425, lng: 1.9389, websiteUrl: "https://www.univ-orleans.fr/fr/iut-orleans" },
  { uai: "9990021I", name: "IUT de Nantes", city: "Nantes", postalCode: "44470", region: "Pays de la Loire", lat: 47.2469, lng: -1.5510, websiteUrl: "https://www.iutnantes.univ-nantes.fr" },

  // ─────────── Bretagne (3) ───────────
  { uai: "9990022I", name: "IUT de Lannion (Rennes 1)", city: "Lannion", postalCode: "22300", region: "Bretagne", lat: 48.7335, lng: -3.4584, websiteUrl: "https://iut-lannion.univ-rennes.fr" },
  { uai: "9990023I", name: "IUT de Brest (UBO)", city: "Brest", postalCode: "29200", region: "Bretagne", lat: 48.4015, lng: -4.4828, websiteUrl: "https://www.univ-brest.fr/iut-brest" },
  { uai: "9990024I", name: "IUT de Vannes (UBS)", city: "Vannes", postalCode: "56000", region: "Bretagne", lat: 47.6471, lng: -2.7615, websiteUrl: "https://www.iutvannes.fr" },

  // ─────────── Normandie + Hauts-de-France (4) ───────────
  { uai: "9990025I", name: "IUT de Caen (Université de Caen Normandie)", city: "Caen", postalCode: "14032", region: "Normandie", lat: 49.2055, lng: -0.3729, websiteUrl: "https://iut-caen.unicaen.fr" },
  { uai: "9990026I", name: "IUT de Rouen", city: "Mont-Saint-Aignan", postalCode: "76130", region: "Normandie", lat: 49.4513, lng: 1.0780, websiteUrl: "https://iutrouen.univ-rouen.fr" },
  { uai: "9990027I", name: "IUT 'A' de Lille (Université de Lille)", city: "Villeneuve-d'Ascq", postalCode: "59653", region: "Hauts-de-France", lat: 50.6125, lng: 3.1382, websiteUrl: "https://www.iut-a.univ-lille.fr" },
  { uai: "9990028I", name: "IUT du Littoral Côte d'Opale (ULCO)", city: "Calais", postalCode: "62100", region: "Hauts-de-France", lat: 50.9457, lng: 1.8587, websiteUrl: "https://www.univ-littoral.fr" },

  // ─────────── Grand Est (2) ───────────
  { uai: "9990029I", name: "IUT de Reims-Champagne-Ardenne", city: "Reims", postalCode: "51100", region: "Grand Est", lat: 49.2436, lng: 4.0610, websiteUrl: "https://www.univ-reims.fr/iut-rcc" },
  { uai: "9990030I", name: "IUT Nancy-Brabois (Université de Lorraine)", city: "Vandoeuvre-lès-Nancy", postalCode: "54506", region: "Grand Est", lat: 48.6499, lng: 6.1530, websiteUrl: "https://iutnb.univ-lorraine.fr" },
];

async function main() {
  if (IUTS.length !== 30) {
    throw new Error(`Expected 30 IUTs, got ${IUTS.length}`);
  }
  const db = createDb(DB_PATH);

  const rows: SchoolInsert[] = IUTS.map((i) => ({
    uai: i.uai,
    name: i.name,
    city: i.city,
    postalCode: i.postalCode,
    region: i.region,
    lat: Math.round(i.lat * 1e6),
    lng: Math.round(i.lng * 1e6),
    type: "iut",
    websiteUrl: i.websiteUrl,
  }));

  console.log(`Seeding ${rows.length} IUT…`);
  await db
    .insert(schools)
    .values(rows)
    .onConflictDoUpdate({
      target: schools.uai,
      set: {
        name: sql`excluded.name`,
        city: sql`excluded.city`,
        postalCode: sql`excluded.postal_code`,
        region: sql`excluded.region`,
        lat: sql`excluded.lat_x1e6`,
        lng: sql`excluded.lng_x1e6`,
        type: sql`excluded.type`,
        websiteUrl: sql`excluded.website_url`,
        updatedAt: sql`(unixepoch())`,
      },
    });

  console.log(`OK — ${rows.length} IUT upserted (cible : 30).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
