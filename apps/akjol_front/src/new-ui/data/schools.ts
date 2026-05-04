import type { Program, SchoolMeta } from "../types";
import { PROGRAMS } from "./programs";

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

let cache: SchoolEntry[] | null = null;

export function getAllSchools(): SchoolEntry[] {
  if (cache) return cache;
  const map = new Map<string, SchoolEntry>();
  for (const p of PROGRAMS) {
    const id = slugifySchool(p.school.name, p.school.city);
    const existing = map.get(id);
    if (existing) {
      existing.programs.push(p);
      // promote richer metadata if missing
      existing.rating = existing.rating ?? p.school.rating;
      existing.websiteUrl = existing.websiteUrl ?? p.school.websiteUrl;
      existing.jpoUrl = existing.jpoUrl ?? p.school.jpoUrl;
      existing.description = existing.description ?? p.school.description;
      existing.type = existing.type ?? p.school.type;
    } else {
      map.set(id, {
        id,
        name: p.school.name,
        city: p.school.city,
        rating: p.school.rating,
        websiteUrl: p.school.websiteUrl,
        jpoUrl: p.school.jpoUrl,
        description: p.school.description,
        type: p.school.type,
        countryRef: p.countryRef,
        programs: [p],
      });
    }
  }
  cache = Array.from(map.values()).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
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
