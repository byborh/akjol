/**
 * Google OAuth 2.0 + OIDC, implémenté à la main pour rester léger et
 * débugguable. Pas de dépendance externe. Flow : authorization code avec
 * state (CSRF) — pas de PKCE car le client_secret est côté serveur Next.
 *
 * Côté Google Cloud Console (à faire une fois en dev) :
 *   1. https://console.cloud.google.com/apis/credentials
 *   2. « Créer des identifiants » → « ID client OAuth » → Web application
 *   3. URI de redirection autorisé : http://localhost:3000/api/auth/google/callback
 *   4. Reporter Client ID + Client Secret dans .env.local
 *
 * En prod, ajouter aussi le domaine final dans les URI autorisés.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_OAUTH_STATE_COOKIE = "akjol_google_state";
export const GOOGLE_OAUTH_NEXT_COOKIE = "akjol_google_next";

export type GoogleProfile = {
  sub: string; // ID Google stable (à stocker dans users.googleId)
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      !process.env.GOOGLE_CLIENT_ID.includes("PLACEHOLDER"),
  );
}

function redirectUri(origin: string): string {
  return `${origin}/api/auth/google/callback`;
}

/** Construit l'URL Google à laquelle rediriger l'user (start du flow). */
export function buildAuthUrl(origin: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Échange le code reçu en callback contre un access_token + id_token. */
export async function exchangeCode(origin: string, code: string): Promise<{ idToken: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { id_token?: string; access_token?: string };
  if (!json.id_token) throw new Error("Google did not return id_token");
  return { idToken: json.id_token };
}

/**
 * Décode (sans vérifier la signature — Google est de confiance ici et on
 * vient juste d'échanger un code valide via HTTPS) le payload du JWT id_token.
 * Pour vérifier la signature il faudrait fetch les JWKS — pas nécessaire ici.
 */
export function decodeIdToken(idToken: string): GoogleProfile {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid id_token");
  const payload = JSON.parse(
    Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
  ) as {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    given_name?: string;
    picture?: string;
  };
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name ?? payload.given_name ?? payload.email.split("@")[0],
    picture: payload.picture,
  };
}

/**
 * Récupère le profil via userinfo si on n'a que l'access_token. Non utilisé
 * dans le flow par défaut (on prend tout du id_token) — exporté au cas où.
 */
export async function fetchUserInfo(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
  const json = (await res.json()) as {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
  };
  return {
    sub: json.sub,
    email: json.email,
    emailVerified: Boolean(json.email_verified),
    name: json.name ?? json.email.split("@")[0],
    picture: json.picture,
  };
}
