import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { users } from "@akjol/db";
import { encodeSession, isValidEmail, SESSION_COOKIE } from "../../../../lib/session";
import { getDb } from "../../../../lib/db";

const Body = z.object({
  email: z.string(),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success || !isValidEmail(parsed.data.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const name = (parsed.data.name ?? "").trim() || email.split("@")[0];

  // Upsert dans la table users si la DB est disponible. Si elle ne l'est pas,
  // on génère un userId déterministe basé sur l'email pour rester cohérent
  // d'une session à l'autre — le user existe en cookie mais la sync ne marchera
  // pas tant que la DB n'est pas branchée (cf. /api/passport).
  const db = getDb();
  let userId: string;
  let role: "student" | "curator" | "admin" = "student";

  if (db) {
    try {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing[0]) {
        userId = existing[0].id;
        role = (existing[0].role as typeof role) ?? "student";
        await db
          .update(users)
          .set({ lastLoginAt: new Date(), name })
          .where(eq(users.id, userId));
      } else {
        userId = nanoid(12);
        await db.insert(users).values({ id: userId, email, name, role: "student" });
      }
    } catch (err) {
      console.warn("[/api/auth/login] DB write failed, falling back to cookie-only", err);
      userId = `nodb_${Buffer.from(email).toString("base64url").slice(0, 8)}`;
    }
  } else {
    userId = `nodb_${Buffer.from(email).toString("base64url").slice(0, 8)}`;
  }

  const token = encodeSession({
    userId,
    email,
    name,
    role,
    iat: Math.floor(Date.now() / 1000),
  });
  const res = NextResponse.json({ ok: true, user: { email, name, userId } });
  res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
  return res;
}
