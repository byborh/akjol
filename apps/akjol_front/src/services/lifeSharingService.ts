import type { LifeSession } from '../types';

const SHARE_QUERY_KEY = 'shareLife';
const PAYLOAD_VERSION = 1;
const DEFAULT_SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SharedLifePayload = {
  version: number;
  exportedAt: number;
  expiresAt: number;
  life: LifeSession;
};

export type SharedLifePreview = {
  name: string;
  stepsCount: number;
  exportedAt: number;
  expiresAt: number;
};

type PreparedLifeImport = {
  preview: SharedLifePreview;
  session: LifeSession;
};

type ShareTokenOptions = {
  ttlMs?: number;
};

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingLength);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLifeSession(value: unknown): value is LifeSession {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string') return false;
  if (typeof value.name !== 'string') return false;
  if (typeof value.createdAt !== 'number') return false;
  if (!Array.isArray(value.path)) return false;

  const stats = value.stats;
  if (!isRecord(stats)) return false;
  if (typeof stats.wallet !== 'number') return false;
  if (typeof stats.stress !== 'number') return false;
  if (typeof stats.age !== 'number') return false;

  if (
    typeof value.startingNodeId !== 'number' &&
    value.startingNodeId !== null &&
    value.startingNodeId !== undefined
  ) {
    return false;
  }

  return true;
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parsePayloadFromToken(token: string): SharedLifePayload {
  const decoded = fromBase64Url(token);
  const parsed = JSON.parse(decoded) as unknown;

  if (!isRecord(parsed)) {
    throw new Error('Le format de partage est invalide.');
  }

  if (parsed.version !== PAYLOAD_VERSION) {
    throw new Error('Cette version de partage n est pas supportee.');
  }

  if (typeof parsed.exportedAt !== 'number') {
    throw new Error('Metadonnees de partage invalides.');
  }

  if (typeof parsed.expiresAt !== 'number') {
    throw new Error('Date d expiration invalide.');
  }

  if (Date.now() > parsed.expiresAt) {
    throw new Error('Ce lien de partage a expire.');
  }

  if (!isLifeSession(parsed.life)) {
    throw new Error('La vie partagee est invalide.');
  }

  return parsed as SharedLifePayload;
}

function extractTokenFromInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Collez un lien ou un token de partage.');
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const token = url.searchParams.get(SHARE_QUERY_KEY);
  if (!token) {
    throw new Error('Ce lien ne contient pas de vie partagee.');
  }

  return token;
}

export const LifeSharingService = {
  getDefaultShareTtlMs(): number {
    return DEFAULT_SHARE_TTL_MS;
  },

  createShareToken(session: LifeSession, options?: ShareTokenOptions): string {
    const ttlMs = options?.ttlMs ?? DEFAULT_SHARE_TTL_MS;
    const safeTtlMs = ttlMs > 0 ? ttlMs : DEFAULT_SHARE_TTL_MS;
    const now = Date.now();

    const payload: SharedLifePayload = {
      version: PAYLOAD_VERSION,
      exportedAt: now,
      expiresAt: now + safeTtlMs,
      life: session
    };

    return toBase64Url(JSON.stringify(payload));
  },

  buildShareUrl(token: string): string {
    const url = new URL(window.location.href);
    url.searchParams.set(SHARE_QUERY_KEY, token);
    return url.toString();
  },

  buildShareUrlForSession(session: LifeSession, options?: ShareTokenOptions): string {
    const token = this.createShareToken(session, options);
    return this.buildShareUrl(token);
  },

  prepareImportFromInput(input: string): PreparedLifeImport {
    const token = extractTokenFromInput(input);
    const payload = parsePayloadFromToken(token);

    const session: LifeSession = {
      ...payload.life,
      id: createSessionId(),
      createdAt: Date.now(),
      name: payload.life.name.trim() || 'Vie importee'
    };

    return {
      preview: {
        name: session.name,
        stepsCount: session.path.length,
        exportedAt: payload.exportedAt,
        expiresAt: payload.expiresAt
      },
      session
    };
  },

  importSessionFromInput(input: string): LifeSession {
    return this.prepareImportFromInput(input).session;
  },

  consumeTokenFromCurrentUrl(): string | null {
    const url = new URL(window.location.href);
    const token = url.searchParams.get(SHARE_QUERY_KEY);

    if (!token) {
      return null;
    }

    url.searchParams.delete(SHARE_QUERY_KEY);
    window.history.replaceState({}, document.title, url.toString());

    return token;
  }
};
