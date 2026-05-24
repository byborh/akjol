import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { users } from "@akjol/db";
import { encodeSession, isValidEmail, SESSION_COOKIE } from "../../../../lib/session";
import { hashPassword, passwordPolicyError } from "../../../../lib/password";
import { getDb } from "../../../../lib/db";
import { clientIp, rateLimitResponse } from "../../../../lib/rate-limit";

const Body = z.object({
  email: z.string(),
  password: z.string(),
  name: z.string().optional(),
  birthYear: z.number().int(),
  acceptTerms: z.boolean(),
});

// RGPD Art. 8 : seuil français de consentement numérique fixé à 15 ans.
// On ne stocke pas l'année de naissance (le refus suffit comme preuve
// d'audit, et minimiser la collecte de PII est l'esprit du RGPD). Pour
// passer < 15 ans il faudra implémenter le double consentement parental.
const MIN_AGE_YEARS = 15;

export async function POST(req: Request) {
  const limited = rateLimitResponse(`signup:${clientIp(req)}`, 3, 60 * 60_000);
  if (limited) return limited;

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

  if (!parsed.data.acceptTerms) {
    return NextResponse.json(
      { error: "Tu dois accepter les CGU et la politique de confidentialité pour créer un compte." },
      { status: 400 },
    );
  }

  const currentYear = new Date().getUTCFullYear();
  const age = currentYear - parsed.data.birthYear;
  if (!Number.isFinite(age) || age < MIN_AGE_YEARS || age > 120) {
    return NextResponse.json(
      {
        error:
          "AkJol est réservé aux personnes de 15 ans et plus. Reviens à ton anniversaire — ou demande à un parent.",
      },
      { status: 403 },
    );
  }

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
