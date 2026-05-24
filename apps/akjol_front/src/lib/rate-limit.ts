import { NextResponse } from "next/server";

/**
 * Rate-limiter in-memory à token bucket simple. Process-local : OK pour
 * une instance unique (Vercel Hobby, dev local). Sur Vercel Pro avec
 * autoscaling, chaque worker a son propre compteur — il faut alors
 * passer sur `@upstash/ratelimit` + Redis pour un compteur global.
 *
 * Choix volontaire : on tolère cette approximation au stade POC. Le pire
 * cas (N workers × limite) reste loin devant un attaquant brute-force.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Nettoyage opportuniste — on n'a pas de timer pour ne pas tenir le
// process éveillé en serverless. À chaque check on évacue les expirés
// si la map grossit, pour éviter une fuite mémoire en cas d'attaque.
const MAX_BUCKETS = 10_000;

function evictExpired(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  evictExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return { ok: bucket.count <= limit, remaining, resetAt: bucket.resetAt };
}

/**
 * Extrait une IP "best effort" depuis les headers proxy. Vercel set
 * `x-forwarded-for` ; on prend le premier hop, qui est le client réel.
 * En cas d'absence, fallback sur "unknown" — c'est imparfait mais évite
 * de crasher un endpoint si le runtime change.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * Helper : applique un rate-limit et retourne soit la `NextResponse` 429
 * prête à renvoyer, soit `null` si le quota n'est pas atteint.
 */
export function rateLimitResponse(
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const result = checkRateLimit(key, limit, windowMs);
  if (result.ok) return null;
  const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Trop de requêtes. Réessayez dans quelques instants." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}
