import crypto from "node:crypto";

export type Session = {
  email: string;
  name: string;
  iat: number;
};

const COOKIE_NAME = "akjol_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): string {
  return process.env.AKJOL_SESSION_SECRET ?? "dev-secret-do-not-use-in-prod";
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(s: string): Buffer {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payload: string): string {
  return base64url(
    crypto.createHmac("sha256", getSecret()).update(payload).digest(),
  );
}

export function encodeSession(session: Session): string {
  const payload = base64url(Buffer.from(JSON.stringify(session)));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(fromBase64url(payload).toString("utf8")) as Session;
    if (typeof data.email !== "string" || typeof data.name !== "string") return null;
    if (data.iat && Date.now() / 1000 - data.iat > MAX_AGE_SECONDS) return null;
    return data;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  },
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
