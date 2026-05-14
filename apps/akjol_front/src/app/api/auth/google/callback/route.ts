import { NextResponse, type NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { users } from "@akjol/db";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  decodeIdToken,
  exchangeCode,
} from "../../../../../lib/google-oauth";
import { encodeSession, SESSION_COOKIE } from "../../../../../lib/session";
import { getDb } from "../../../../../lib/db";

/**
 * Callback du flow OAuth Google. Vérifie le state CSRF, échange le code
 * contre un id_token, upsert le user en DB (sur email + googleId), émet
 * la session HMAC, redirige vers `next` (ou /onboarding si passport vide
 * — la décision est prise côté client après reload via auth-store).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorParam)}`, url.origin),
    );
  }
  if (!code || !stateParam) {
    return NextResponse.redirect(new URL("/login?error=missing_params", url.origin));
  }

  // req.cookies.get() décode automatiquement les valeurs (contrairement à
  // req.headers.get("cookie") qui renvoie le raw percent-encoded).
  const stateCookie = req.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const nextCookieRaw = req.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value;
  const nextCookie =
    nextCookieRaw && nextCookieRaw.startsWith("/") && !nextCookieRaw.startsWith("//")
      ? nextCookieRaw
      : "/account";

  if (!stateCookie || stateCookie !== stateParam) {
    return NextResponse.redirect(new URL("/login?error=state_mismatch", url.origin));
  }

  let profile;
  try {
    const { idToken } = await exchangeCode(url.origin, code);
    profile = decodeIdToken(idToken);
  } catch (err) {
    console.error("[/api/auth/google/callback]", err);
    return NextResponse.redirect(new URL("/login?error=google_exchange_failed", url.origin));
  }

  const db = getDb();
  if (!db) {
    return NextResponse.redirect(new URL("/login?error=db_unavailable", url.origin));
  }

  // Match par googleId d'abord, fallback sur email (pour fusionner un user
  // qui aurait déjà un compte password avec le même email).
  const byGoogle = await db
    .select()
    .from(users)
    .where(eq(users.googleId, profile.sub))
    .limit(1);
  let user = byGoogle[0];
  let isNewUser = false;

  if (!user) {
    const byEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.email))
      .limit(1);
    if (byEmail[0]) {
      await db
        .update(users)
        .set({
          googleId: profile.sub,
          emailVerified: profile.emailVerified,
          avatarUrl: profile.picture,
          lastLoginAt: new Date(),
        })
        .where(eq(users.id, byEmail[0].id));
      user = { ...byEmail[0], googleId: profile.sub };
    } else {
      const userId = nanoid(12);
      await db.insert(users).values({
        id: userId,
        email: profile.email,
        name: profile.name,
        role: "student",
        provider: "google",
        googleId: profile.sub,
        emailVerified: profile.emailVerified,
        avatarUrl: profile.picture,
      });
      const inserted = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      user = inserted[0];
      isNewUser = true;
    }
  } else {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        avatarUrl: profile.picture,
        name: user.name || profile.name,
      })
      .where(eq(users.id, user.id));
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=upsert_failed", url.origin));
  }

  const token = encodeSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: (user.role as "student" | "curator" | "admin") ?? "student",
    iat: Math.floor(Date.now() / 1000),
  });

  // Nouveau compte → /onboarding (avec flag newUser=1 pour que le client wipe
  // d'éventuelles données persona de localStorage avant de présenter le flow).
  // User existant → `next` cookie (par défaut /account), avec `from=google`
  // pour déclencher le refresh auth-store côté client.
  let destPath: string;
  if (isNewUser) {
    destPath = "/onboarding?newUser=1";
  } else {
    const sep = nextCookie.includes("?") ? "&" : "?";
    destPath = `${nextCookie}${sep}from=google`;
  }
  const res = NextResponse.redirect(new URL(destPath, url.origin));
  res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { maxAge: 0, path: "/" });
  res.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
