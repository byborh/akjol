import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE, type Session } from "../session";
import { rateLimitResponse } from "../rate-limit";

/**
 * Garde-fou côté API : le middleware bloque déjà l'accès aux routes /admin/*,
 * mais les /api/admin/* sont hors du matcher (les API sont préfixées /api).
 * On re-vérifie la session ici pour empêcher toute requête forgée d'écrire
 * en DB sans rôle adéquat. Defense in depth.
 *
 * Le 2e argument `req` est optionnel : quand il est fourni, on applique un
 * rate-limit (60 req/min/userId) sur les méthodes d'écriture pour limiter
 * l'impact d'un compte curator/admin compromis ou d'un script en boucle.
 */
export async function requireCurator(
  req?: Request,
): Promise<{ ok: true; session: Session } | { ok: false; response: NextResponse }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE.name)?.value;
  const session = decodeSession(token);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.role !== "curator" && session.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: curator role required" },
        { status: 403 },
      ),
    };
  }

  if (req) {
    const method = req.method.toUpperCase();
    if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
      const limited = rateLimitResponse(`admin:${session.userId}`, 60, 60_000);
      if (limited) return { ok: false, response: limited };
    }
  }

  return { ok: true, session };
}
