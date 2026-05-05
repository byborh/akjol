export type DiplomaOption = {
  code: string;
  countryRef: string;
  nativeName: string;
  translated: string;
  scaleMax: number;
};

export const DIPLOMAS: DiplomaOption[] = [
  { code: "BAC_GENERAL", countryRef: "FR", nativeName: "Baccalauréat général", translated: "Diplôme de fin de lycée", scaleMax: 20 },
  { code: "BAC_TECHNO", countryRef: "FR", nativeName: "Baccalauréat technologique", translated: "Diplôme de fin de lycée techno", scaleMax: 20 },
  { code: "BAC_PRO", countryRef: "FR", nativeName: "Baccalauréat professionnel", translated: "Diplôme de fin de lycée pro", scaleMax: 20 },
  { code: "BTS_SIO_SISR", countryRef: "FR", nativeName: "BTS SIO option SISR", translated: "Bac+2 réseaux & infrastructures", scaleMax: 20 },
  { code: "BTS_SIO_SLAM", countryRef: "FR", nativeName: "BTS SIO option SLAM", translated: "Bac+2 développement applications", scaleMax: 20 },
  { code: "DUT_INFO", countryRef: "FR", nativeName: "BUT Informatique", translated: "Bac+3 informatique", scaleMax: 20 },
  { code: "LICENCE_INFO", countryRef: "FR", nativeName: "Licence Informatique", translated: "Bac+3 universitaire", scaleMax: 20 },
  { code: "STPM", countryRef: "MY", nativeName: "STPM", translated: "Sijil Tinggi Persekolahan Malaysia", scaleMax: 4 },
  { code: "SPM", countryRef: "MY", nativeName: "SPM", translated: "Sijil Pelajaran Malaysia (~ fin de lycée)", scaleMax: 100 },
  { code: "A_LEVEL", countryRef: "GB", nativeName: "A-Level", translated: "Diplôme de fin de lycée britannique", scaleMax: 100 },
  { code: "HS_DIPLOMA", countryRef: "US", nativeName: "High School Diploma", translated: "Fin de lycée US", scaleMax: 4 },
  { code: "ABITUR", countryRef: "DE", nativeName: "Abitur", translated: "Diplôme de fin de lycée allemand", scaleMax: 1 },
];

export function getDiplomasForCountry(country: string): DiplomaOption[] {
  return DIPLOMAS.filter((d) => d.countryRef === country);
}

export function findDiploma(code: string): DiplomaOption | undefined {
  return DIPLOMAS.find((d) => d.code === code);
}
