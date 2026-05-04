interface AuthSession {
  email: string;
  timestamp: number;
}

const AUTH_KEY = 'akjol_auth_session';
const AUTH_EXPIRY_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export const AuthService = {
  /**
   * Save authentication session with expiry time
   */
  saveAuthSession(email: string): void {
    const session: AuthSession = {
      email,
      timestamp: Date.now()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  },

  /**
   * Get authentication session if still valid (not expired)
   * Returns null if no session or if expired
   */
  getAuthSession(): AuthSession | null {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;

    try {
      const session: AuthSession = JSON.parse(stored);
      const now = Date.now();
      const elapsed = now - session.timestamp;

      if (elapsed > AUTH_EXPIRY_MS) {
        // Session expired, clear it
        this.clearAuthSession();
        return null;
      }

      return session;
    } catch {
      // Invalid JSON, clear and return null
      this.clearAuthSession();
      return null;
    }
  },

  /**
   * Clear authentication session
   */
  clearAuthSession(): void {
    localStorage.removeItem(AUTH_KEY);
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.getAuthSession() !== null;
  }
};
