export type CostOfLiving = {
  city: string;
  country: string;
  monthlyRent: number;
  monthlyFood: number;
  monthlyTransport: number;
  monthlyOther: number;
  currency: "EUR" | "GBP" | "USD" | "CAD" | "SGD" | "MYR" | "CHF";
  lastUpdated: string;
};

export const COST_OF_LIVING: CostOfLiving[] = [
  { city: "Paris", country: "FR", monthlyRent: 800, monthlyFood: 280, monthlyTransport: 84, monthlyOther: 200, currency: "EUR", lastUpdated: "2026-01-10" },
  { city: "Lyon", country: "FR", monthlyRent: 520, monthlyFood: 250, monthlyTransport: 65, monthlyOther: 180, currency: "EUR", lastUpdated: "2026-01-10" },
  { city: "Toulouse", country: "FR", monthlyRent: 470, monthlyFood: 240, monthlyTransport: 50, monthlyOther: 180, currency: "EUR", lastUpdated: "2026-01-10" },
  { city: "Villetaneuse", country: "FR", monthlyRent: 600, monthlyFood: 260, monthlyTransport: 84, monthlyOther: 180, currency: "EUR", lastUpdated: "2026-01-10" },
  { city: "Saclay", country: "FR", monthlyRent: 550, monthlyFood: 260, monthlyTransport: 84, monthlyOther: 180, currency: "EUR", lastUpdated: "2026-01-10" },
  { city: "Nice", country: "FR", monthlyRent: 580, monthlyFood: 250, monthlyTransport: 47, monthlyOther: 180, currency: "EUR", lastUpdated: "2026-01-10" },
  { city: "Sophia Antipolis", country: "FR", monthlyRent: 560, monthlyFood: 250, monthlyTransport: 50, monthlyOther: 180, currency: "EUR", lastUpdated: "2026-01-10" },
  { city: "London", country: "GB", monthlyRent: 1100, monthlyFood: 320, monthlyTransport: 180, monthlyOther: 250, currency: "GBP", lastUpdated: "2026-01-15" },
  { city: "Manchester", country: "GB", monthlyRent: 700, monthlyFood: 280, monthlyTransport: 80, monthlyOther: 220, currency: "GBP", lastUpdated: "2026-01-15" },
  { city: "Munich", country: "DE", monthlyRent: 600, monthlyFood: 250, monthlyTransport: 50, monthlyOther: 200, currency: "EUR", lastUpdated: "2026-01-12" },
  { city: "Berlin", country: "DE", monthlyRent: 550, monthlyFood: 230, monthlyTransport: 49, monthlyOther: 180, currency: "EUR", lastUpdated: "2026-01-12" },
  { city: "Singapore", country: "SG", monthlyRent: 1200, monthlyFood: 400, monthlyTransport: 100, monthlyOther: 200, currency: "SGD", lastUpdated: "2026-01-08" },
  { city: "Kuala Lumpur", country: "MY", monthlyRent: 1500, monthlyFood: 800, monthlyTransport: 200, monthlyOther: 600, currency: "MYR", lastUpdated: "2026-01-08" },
  { city: "Boston", country: "US", monthlyRent: 1800, monthlyFood: 450, monthlyTransport: 90, monthlyOther: 350, currency: "USD", lastUpdated: "2026-01-20" },
  { city: "New York", country: "US", monthlyRent: 2200, monthlyFood: 500, monthlyTransport: 132, monthlyOther: 400, currency: "USD", lastUpdated: "2026-01-20" },
  { city: "Toronto", country: "CA", monthlyRent: 1700, monthlyFood: 400, monthlyTransport: 156, monthlyOther: 350, currency: "CAD", lastUpdated: "2026-01-22" },
  { city: "Montréal", country: "CA", monthlyRent: 1100, monthlyFood: 380, monthlyTransport: 99, monthlyOther: 300, currency: "CAD", lastUpdated: "2026-01-22" },
  { city: "Brussels", country: "BE", monthlyRent: 700, monthlyFood: 280, monthlyTransport: 50, monthlyOther: 220, currency: "EUR", lastUpdated: "2026-01-12" },
  { city: "Lausanne", country: "CH", monthlyRent: 1100, monthlyFood: 450, monthlyTransport: 80, monthlyOther: 350, currency: "CHF", lastUpdated: "2026-01-12" },
  { city: "Madrid", country: "ES", monthlyRent: 700, monthlyFood: 250, monthlyTransport: 55, monthlyOther: 200, currency: "EUR", lastUpdated: "2026-01-12" },
];

const TO_EUR: Record<string, number> = {
  EUR: 1,
  GBP: 1.18,
  USD: 0.92,
  CAD: 0.68,
  SGD: 0.69,
  MYR: 0.21,
  CHF: 1.05,
};

export function totalMonthly(c: CostOfLiving): number {
  return c.monthlyRent + c.monthlyFood + c.monthlyTransport + c.monthlyOther;
}

export function totalMonthlyEur(c: CostOfLiving): number {
  return totalMonthly(c) * (TO_EUR[c.currency] ?? 1);
}

export function findCity(city: string): CostOfLiving | undefined {
  const norm = city.trim().toLowerCase();
  return COST_OF_LIVING.find((c) => c.city.toLowerCase() === norm);
}

export function citiesByCountry(country: string): CostOfLiving[] {
  return COST_OF_LIVING.filter((c) => c.country === country);
}

export function avgMonthlyEurForCountry(country: string): number | undefined {
  const xs = citiesByCountry(country);
  if (xs.length === 0) return undefined;
  return xs.reduce((s, x) => s + totalMonthlyEur(x), 0) / xs.length;
}
