export type LanguageOption = { code: string; name: string };

export const LANGUAGES: LanguageOption[] = [
  { code: "fr", name: "Français" },
  { code: "en", name: "Anglais" },
  { code: "de", name: "Allemand" },
  { code: "es", name: "Espagnol" },
  { code: "ms", name: "Malais" },
  { code: "zh", name: "Chinois" },
  { code: "ar", name: "Arabe" },
  { code: "it", name: "Italien" },
  { code: "ru", name: "Russe" },
];

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const CERTIFICATES = [
  { code: "TOEFL", language: "en", maxScore: 120, label: "TOEFL iBT" },
  { code: "IELTS", language: "en", maxScore: 9, label: "IELTS" },
  { code: "TOEIC", language: "en", maxScore: 990, label: "TOEIC" },
  { code: "DELF_B2", language: "fr", maxScore: 100, label: "DELF B2" },
  { code: "TestDaF", language: "de", maxScore: 5, label: "TestDaF" },
];
