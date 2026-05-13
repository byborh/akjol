/**
 * Variante edge-compatible de session.ts pour le middleware Next.
 *
 * decodeSession() utilise node:crypto qui n'est pas disponible dans
 * l'Edge Runtime. Ici on réimplémente la vérif HMAC-SHA256 via Web Crypto
 * (SubtleCrypto.sign), avec exactement le même format de token (payload.sig
 * en base64url) que session.ts → tokens 100% interopérables.
 */

import type { Session } from "./session";

const COOKIE_NAME = "akjol_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): string {
  return process.env.AKJOL_SESSION_SECRET ?? "dev-secret-do-not-use-in-prod";
}

function base64urlFromBytes(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromBase64url(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64urlFromBytes(sig);
}

export async function decodeSessionEdge(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmacSign(payload);
  if (sig.length !== expected.length) return null;

  // Comparaison constant-time manuelle (timingSafeEqual indispo en edge)
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  try {
    const decoded = new TextDecoder().decode(bytesFromBase64url(payload));
    const data = JSON.parse(decoded) as Partial<Session>;
    if (
      typeof data.email !== "string" ||
      typeof data.name !== "string" ||
      typeof data.userId !== "string"
    ) {
      return null;
    }
    if (data.iat && Date.now() / 1000 - data.iat > MAX_AGE_SECONDS) return null;
    return {
      userId: data.userId,
      email: data.email,
      name: data.name,
      role: (data.role as Session["role"]) ?? "student",
      iat: data.iat ?? 0,
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
