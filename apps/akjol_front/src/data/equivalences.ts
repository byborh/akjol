export type EquivalenceKind =
  | "equivalent"
  | "acceptedAs"
  | "requiresBridge"
  | "notRecognized";

export type EquivalenceEdge = {
  id: string;
  from: string;
  to: string;
  kind: EquivalenceKind;
  weight: number;
  note?: string;
};

export const SEED_EQUIVALENCES: EquivalenceEdge[] = [
  { id: "e1", from: "BAC_GENERAL", to: "A_LEVEL", kind: "equivalent", weight: 1, note: "Niveau lycée généraliste; A-Level demande typiquement 3 matières fortes." },
  { id: "e2", from: "BAC_GENERAL", to: "ABITUR", kind: "equivalent", weight: 0.95 },
  { id: "e3", from: "BAC_GENERAL", to: "HS_DIPLOMA", kind: "acceptedAs", weight: 0.85, note: "Accepté par universités US mais SAT/ACT souvent demandé." },
  { id: "e4", from: "STPM", to: "A_LEVEL", kind: "equivalent", weight: 0.95, note: "Reconnu par UCAS comme équivalent A-Level pour la plupart des cursus." },
  { id: "e5", from: "STPM", to: "BAC_GENERAL", kind: "acceptedAs", weight: 0.9, note: "Acceptation FR via Campus France." },
  { id: "e6", from: "BTS_SIO_SISR", to: "DUT_INFO", kind: "acceptedAs", weight: 0.85, note: "Passerelle possible vers L3 ou Licence Pro." },
  { id: "e7", from: "BTS_SIO_SLAM", to: "DUT_INFO", kind: "acceptedAs", weight: 0.85 },
  { id: "e8", from: "BTS_SIO_SISR", to: "LICENCE_INFO", kind: "requiresBridge", weight: 0.6, note: "Admission possible en L3 sur dossier, parfois mise à niveau." },
  { id: "e9", from: "DUT_INFO", to: "LICENCE_INFO", kind: "equivalent", weight: 0.95 },
  { id: "e10", from: "SPM", to: "BAC_GENERAL", kind: "notRecognized", weight: 0, note: "SPM fin de secondaire MY ≠ Bac. Foundation year nécessaire pour cursus FR/UK." },
];
