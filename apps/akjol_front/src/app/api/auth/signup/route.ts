import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { users } from "@akjol/db";
import { encodeSession, isValidEmail, SESSION_COOKIE } from "../../../../lib/session";
import { hashPassword, passwordPolicyError } from "../../../../lib/password";
import { getDb } from "../../../../lib/db";

const Body = z.object({
  email: z.string(),
  password: z.string(),
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
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const name = (parsed.data.name ?? "").trim() || email.split("@")[0];

  const policyErr = passwordPolicyError(password);
  if (policyErr) return NextResponse.json({ error: policyErr }, { status: 400 });

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Service indisponible (base de données non configurée)." },
      { status: 503 },
    );
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const userId = nanoid(12);
  await db.insert(users).values({
    id: userId,
    email,
    name,
    role: "student",
    provider: "password",
    passwordHash,
    emailVerified: false,
  });

  const token = encodeSession({
    userId,
    email,
    name,
    role: "student",
    iat: Math.floor(Date.now() / 1000),
  });
  const res = NextResponse.json({
    ok: true,
    requiresOnboarding: true,
    user: { email, name, userId },
  });
  res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
  return res;
}
