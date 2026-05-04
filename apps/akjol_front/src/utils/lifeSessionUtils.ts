import type { LifeSession } from '../types';

export function buildUniqueName(baseName: string, existingNames: string[]): string {
  const cleaned = baseName.trim() || 'Vie importee';
  if (!existingNames.includes(cleaned)) return cleaned;

  let counter = 2;
  let candidate = `${cleaned} (${counter})`;

  while (existingNames.includes(candidate)) {
    counter += 1;
    candidate = `${cleaned} (${counter})`;
  }

  return candidate;
}

export function buildDefaultSession(name: string): LifeSession {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id,
    name,
    createdAt: Date.now(),
    path: [],
    stats: {
      wallet: 0,
      stress: 0,
      age: 17
    },
    startingNodeId: null
  };
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}
