import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@akjol/db";
import { encodeSession, isValidEmail, SESSION_COOKIE } from "../../../../lib/session";
import { verifyPassword } from "../../../../lib/password";
import { getDb } from "../../../../lib/db";
import { clientIp, rateLimitResponse } from "../../../../lib/rate-limit";

const Body = z.object({
  email: z.string(),
  password: z.string(),
});

export async function POST(req: Request) {
  const limited = rateLimitResponse(`login:${clientIp(req)}`, 5, 15 * 60_000);
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success || !isValidEmail(parsed.data.email)) {
    return NextResponse.json({ error: "Email ou mot de passe invalide." }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Service indisponible (base de données non configurée)." },
      { status: 503 },
    );
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = existing[0];

  // Réponse générique pour ne pas révéler si l'email existe ou non.
  if (!user || user.provider !== "password" || !user.passwordHash) {
    return NextResponse.json({ error: "Email ou mot de passe invalide." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Email ou mot de passe invalide." }, { status: 401 });
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const token = encodeSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: (user.role as "student" | "curator" | "admin") ?? "student",
    iat: Math.floor(Date.now() / 1000),
  });
  const res = NextResponse.json({
    ok: true,
    user: { email: user.email, name: user.name, userId: user.id },
  });
  res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
  return res;
}
