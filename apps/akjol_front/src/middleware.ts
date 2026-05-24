import { NextResponse, type NextRequest } from "next/server";
import { decodeSessionEdge, SESSION_COOKIE_NAME } from "./lib/session-edge";

/**
 * Deux responsabilités :
 *
 *  1) Gate /admin/* aux roles curator + admin. Sans session → redirect vers
 *     /account?next=… ; session sans le bon rôle → /account?error=admin-required.
 *
 *  2) Rate-limit basique sur les GET /api/* (300 req/min/IP) pour limiter
 *     les scrapers. Le compteur est process-local (Edge runtime) — sur Vercel
 *     avec autoscaling chaque worker compte séparément, à migrer sur
 *     `@upstash/ratelimit` quand on aura besoin d'un compteur global.
 *
 * Le matcher tient ces routes hors des assets statiques pour ne pas tuer
 * la perf — la vérif HMAC et le check rate-limit sont rapides mais inutiles
 * sur /_next/static.
 */

type Bucket = { count: number; resetAt: number };
const readBuckets = new Map<string, Bucket>();
const READ_LIMIT = 300;
const READ_WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

function clientIpEdge(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function checkReadLimit(ip: string): { ok: boolean; resetAt: number } {
  const now = Date.now();
  if (readBuckets.size >= MAX_BUCKETS) {
    for (const [key, bucket] of readBuckets) {
      if (bucket.resetAt < now) readBuckets.delete(key);
    }
  }
  const bucket = readBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    readBuckets.set(ip, { count: 1, resetAt: now + READ_WINDOW_MS });
    return { ok: true, resetAt: now + READ_WINDOW_MS };
  }
  bucket.count += 1;
  return { ok: bucket.count <= READ_LIMIT, resetAt: bucket.resetAt };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") && req.method === "GET") {
    const ip = clientIpEdge(req);
    const result = checkReadLimit(ip);
    if (!result.ok) {
      const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      return new NextResponse(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques instants." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Limit": String(READ_LIMIT),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await decodeSessionEdge(token);

    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/account";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }

    if (session.role !== "curator" && session.role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/account";
      url.search = "?error=admin-required";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
