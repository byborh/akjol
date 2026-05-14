import type { Program, SchoolMeta } from "../types";
import { PROGRAMS } from "./programs";
import { findSchoolDetail } from "./schoolDetails";

export type SchoolEntry = SchoolMeta & {
  id: string;
  countryRef: string;
  programs: Program[];
};

export function slugifySchool(name: string, city: string): string {
  return [name, city]
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Variante pure : dérive les écoles à partir d'un tableau de programmes
 * arbitraire (utile quand programs vient d'une API/useQuery, pas du fichier
 * statique). Pas de cache — recalcul à chaque appel ; le caller est censé
 * memoiser via useMemo.
 */
export function getSchoolsFrom(programs: Program[]): SchoolEntry[] {
  const map = new Map<string, SchoolEntry>();
  for (const p of programs) {
    const id = slugifySchool(p.school.name, p.school.city);
    const existing = map.get(id);
    if (existing) {
      existing.programs.push(p);
      existing.rating = existing.rating ?? p.school.rating;
      existing.websiteUrl = existing.websiteUrl ?? p.school.websiteUrl;
      existing.jpoUrl = existing.jpoUrl ?? p.school.jpoUrl;
      existing.description = existing.description ?? p.school.description;
      existing.type = existing.type ?? p.school.type;
    } else {
      const detail = findSchoolDetail(id);
      map.set(id, {
        id,
        name: p.school.name,
        city: p.school.city,
        rating: p.school.rating,
        websiteUrl: p.school.websiteUrl,
        jpoUrl: p.school.jpoUrl,
        description: p.school.description,
        type: p.school.type,
        address: detail?.address,
        postalCode: detail?.postalCode,
        phone: detail?.phone,
        email: detail?.email,
        lat: detail?.lat,
        lng: detail?.lng,
        countryRef: p.countryRef,
        programs: [p],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

let cache: SchoolEntry[] | null = null;

/** Cache global pour les call sites qui consomment les fixtures statiques. */
export function getAllSchools(): SchoolEntry[] {
  if (!cache) cache = getSchoolsFrom(PROGRAMS);
  return cache;
}

export function findSchool(id: string): SchoolEntry | undefined {
  return getAllSchools().find((s) => s.id === id);
}

export function findSchoolByProgram(p: Program): SchoolEntry | undefined {
  return findSchool(slugifySchool(p.school.name, p.school.city));
}

export function getUniqueCities(): string[] {
  return Array.from(new Set(getAllSchools().map((s) => s.city))).sort();
}

export function getUniqueCitiesFrom(schools: SchoolEntry[]): string[] {
  return Array.from(new Set(schools.map((s) => s.city))).sort();
}
