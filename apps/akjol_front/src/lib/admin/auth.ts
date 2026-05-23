import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE, type Session } from "../session";

/**
 * Garde-fou côté API : le middleware bloque déjà l'accès aux routes /admin/*,
 * mais les /api/admin/* sont hors du matcher (les API sont préfixées /api).
 * On re-vérifie la session ici pour empêcher toute requête forgée d'écrire
 * en DB sans rôle adéquat. Defense in depth.
 */
export async function requireCurator(): Promise<
  { ok: true; session: Session } | { ok: false; response: NextResponse }
> {
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
  return { ok: true, session };
}
