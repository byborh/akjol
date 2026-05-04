import type { LifeSession } from '../types';

const STORAGE_KEY = 'akjol_life_sessions';
const ACTIVE_SESSION_KEY = 'akjol_active_session_id';

function safeParseSessions(raw: string | null): LifeSession[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LifeSession[]) : [];
  } catch {
    return [];
  }
}

function persistSessions(sessions: LifeSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export const StorageService = {
  saveSession(session: LifeSession): void {
    const sessions = this.getAllSessions();
    const index = sessions.findIndex((item) => item.id === session.id);

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }

    persistSessions(sessions);
  },

  getAllSessions(): LifeSession[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return safeParseSessions(raw).sort((a, b) => a.createdAt - b.createdAt);
  },

  deleteSession(id: string): void {
    const sessions = this.getAllSessions().filter((session) => session.id !== id);
    persistSessions(sessions);
  },

  updateSessionName(id: string, newName: string): void {
    const sessions = this.getAllSessions().map((session) =>
      session.id === id
        ? {
            ...session,
            name: newName
          }
        : session
    );

    persistSessions(sessions);
  },

  getActiveSessionId(): string | null {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  },

  setActiveSessionId(id: string | null): void {
    if (id === null) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
    }
  }
};
