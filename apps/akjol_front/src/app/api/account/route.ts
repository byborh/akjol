import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { users } from "@akjol/db";
import { decodeSession, SESSION_COOKIE } from "../../../lib/session";
import { getDb } from "../../../lib/db";

/**
 * DELETE /api/account — RGPD : supprime la ligne `users` et toutes les
 * tables dépendantes en cascade (passport / plan / parcours / documents via
 * onDelete: "cascade" du schéma).
 *
 * Renvoie aussi un cookie expiré pour fermer la session immédiatement.
 * Le front est responsable de wiper son localStorage en parallèle (le store
 * `usePassportStore.reset()` + localStorage.removeItem des autres keys).
 */
export async function DELETE() {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE.name)?.value;
  const session = decodeSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    await db.delete(users).where(eq(users.id, session.userId));
  } catch (err) {
    console.error("[/api/account] DELETE failed", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE.name, "", {
    ...SESSION_COOKIE.options,
    maxAge: 0,
  });
  return res;
}
