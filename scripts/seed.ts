import { createDb, etudes, metiers, etudeMetierLinks } from "@akjol/db";

const db = createDb("./data/akjol.db");

async function main() {
  console.log("Seeding catalogue Tech/Informatique (MVP)...");

  // Études (vertical Tech, du lycée au doctorat)
  const insertedEtudes = await db
    .insert(etudes)
    .values([
      { code: "bac-stmg", label: "Bac STMG", niveau: "bac", duree: 3, type: "bac" },
      { code: "bac-sti2d", label: "Bac STI2D", niveau: "bac", duree: 3, type: "bac" },
      { code: "bac-general", label: "Bac général (spé NSI/Maths)", niveau: "bac", duree: 3, type: "bac" },
      { code: "bts-sio-sisr", label: "BTS SIO option SISR", niveau: "bac+2", duree: 2, type: "bts" },
      { code: "bts-sio-slam", label: "BTS SIO option SLAM", niveau: "bac+2", duree: 2, type: "bts" },
      { code: "bts-cyber", label: "BTS Cybersécurité", niveau: "bac+2", duree: 2, type: "bts" },
      { code: "but-info", label: "BUT Informatique", niveau: "bac+3", duree: 3, type: "but" },
      { code: "licence-info", label: "Licence Informatique", niveau: "bac+3", duree: 3, type: "licence" },
      { code: "licence-pro-reseaux", label: "Licence pro Réseaux & télécoms", niveau: "bac+3", duree: 1, type: "licence-pro" },
      { code: "prepa-mp", label: "Prépa MP / MPSI", niveau: "bac+2", duree: 2, type: "prepa" },
      { code: "ecole-ingenieur", label: "École d'ingénieur", niveau: "bac+5", duree: 3, type: "ecole-ingenieur" },
      { code: "master-info", label: "Master Informatique", niveau: "bac+5", duree: 2, type: "master" },
      { code: "doctorat-info", label: "Doctorat Informatique", niveau: "bac+8", duree: 3, type: "doctorat" },
    ])
    .returning();

  // Métiers Tech
  const insertedMetiers = await db
    .insert(metiers)
    .values([
      { code: "admin-sys", label: "Administrateur systèmes & réseaux", secteur: "IT", salaireMin: 28000, salaireMax: 45000 },
      { code: "dev-fullstack", label: "Développeur fullstack", secteur: "IT", salaireMin: 32000, salaireMax: 55000 },
      { code: "dev-back", label: "Développeur backend", secteur: "IT", salaireMin: 32000, salaireMax: 60000 },
      { code: "data-eng", label: "Data engineer", secteur: "IT", salaireMin: 38000, salaireMax: 70000 },
      { code: "ml-eng", label: "Machine learning engineer", secteur: "IT", salaireMin: 42000, salaireMax: 80000 },
      { code: "cyber-analyst", label: "Analyste cybersécurité", secteur: "IT", salaireMin: 35000, salaireMax: 65000 },
      { code: "devops", label: "Ingénieur DevOps", secteur: "IT", salaireMin: 40000, salaireMax: 75000 },
    ])
    .returning();

  // Quelques liens études → métiers
  const id = (code: string, list: typeof insertedEtudes | typeof insertedMetiers) =>
    list.find((x) => x.code === code)!.id;

  await db.insert(etudeMetierLinks).values([
    { etudeId: id("bts-sio-sisr", insertedEtudes), metierId: id("admin-sys", insertedMetiers) },
    { etudeId: id("bts-sio-slam", insertedEtudes), metierId: id("dev-fullstack", insertedMetiers) },
    { etudeId: id("bts-cyber", insertedEtudes), metierId: id("cyber-analyst", insertedMetiers) },
    { etudeId: id("but-info", insertedEtudes), metierId: id("dev-fullstack", insertedMetiers) },
    { etudeId: id("but-info", insertedEtudes), metierId: id("dev-back", insertedMetiers) },
    { etudeId: id("ecole-ingenieur", insertedEtudes), metierId: id("data-eng", insertedMetiers) },
    { etudeId: id("ecole-ingenieur", insertedEtudes), metierId: id("ml-eng", insertedMetiers) },
    { etudeId: id("ecole-ingenieur", insertedEtudes), metierId: id("devops", insertedMetiers) },
    { etudeId: id("master-info", insertedEtudes), metierId: id("ml-eng", insertedMetiers) },
  ]);

  console.log(`OK: ${insertedEtudes.length} études, ${insertedMetiers.length} métiers.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
