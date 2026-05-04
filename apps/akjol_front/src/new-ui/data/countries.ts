export type Country = { code: string; name: string; flag: string };

export const COUNTRIES: Country[] = [
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "MY", name: "Malaisie", flag: "🇲🇾" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "US", name: "États-Unis", flag: "🇺🇸" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "SG", name: "Singapour", flag: "🇸🇬" },
  { code: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", flag: "🇨🇭" },
  { code: "ES", name: "Espagne", flag: "🇪🇸" },
];

export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
