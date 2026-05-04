import { useMemo, useState } from 'react';
import type { School } from '../types';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fuzzyIncludes(text: string, query: string): boolean {
  if (!query) return true;

  const textNorm = normalize(text);
  const queryNorm = normalize(query);

  if (textNorm.includes(queryNorm)) return true;

  const queryParts = queryNorm.split(/\s+/).filter(Boolean);
  if (queryParts.length === 0) return true;

  return queryParts.every((part) => textNorm.includes(part));
}

export function useSchoolSearch(schools: School[]) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchools = useMemo(() => {
    if (!searchTerm.trim()) return schools;

    return schools.filter((school) => {
      const searchable = `${school.name} ${school.city}`;
      return fuzzyIncludes(searchable, searchTerm);
    });
  }, [schools, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredSchools
  };
}
