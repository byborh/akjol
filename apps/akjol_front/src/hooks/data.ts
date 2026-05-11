"use client";

import { useQuery } from "@tanstack/react-query";
import type { Program } from "../types";
import type { Job } from "../data/jobs";

/**
 * Hooks data — proxy vers les routes API du front (/api/programs, /api/jobs).
 *
 * Les routes API tombent sur les fixtures bundle si la DB SQLite est vide ou
 * indisponible (cf. lib/db.ts + app/api/programs/route.ts) ; ces hooks ne
 * voient JAMAIS la couche fallback, ils consomment du JSON.
 *
 * Defaults TanStack Query (staleTime 60s, gcTime 5min, retry 1, pas de refetch
 * sur focus) sont définis dans QueryProvider — pas de besoin de les répéter ici
 * sauf cas particulier.
 *
 * Note : on cast les DTO renvoyés par l'API vers Program/Job du front. Les
 * shapes sont structurellement compatibles (mêmes noms de champs). Si on
 * resserre un jour le DTO côté @akjol/db, ce cast sera la dernière digue à
 * mettre à jour.
 */

export type ProgramFilters = {
  country?: string;
  level?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type ProgramsResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: Program[];
};

type JobsResponse = {
  total: number;
  items: Job[];
};

function buildQuery(filters: ProgramFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.country) params.set("country", filters.country);
  if (filters.level) params.set("level", filters.level);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  // pageSize par défaut sur l'API = 20 ; on remonte à 200 par défaut côté client
  // pour les pages catalogue/explore qui veulent voir tout d'un coup.
  params.set("pageSize", String(filters.pageSize ?? 200));
  return params.toString();
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

export function usePrograms(filters: ProgramFilters = {}) {
  const qs = buildQuery(filters);
  return useQuery({
    queryKey: ["programs", filters],
    queryFn: () => fetchJSON<ProgramsResponse>(`/api/programs?${qs}`),
    select: (data) => data.items,
  });
}

export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: ["program", id],
    queryFn: () => fetchJSON<Program>(`/api/programs/${id}`),
    enabled: !!id,
  });
}

export function useJobs(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery({
    queryKey: ["jobs", search ?? null],
    queryFn: () => fetchJSON<JobsResponse>(`/api/jobs${qs}`),
    select: (data) => data.items,
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => fetchJSON<Job>(`/api/jobs/${id}`),
    enabled: !!id,
  });
}
