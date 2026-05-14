import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  buildAuthUrl,
  googleConfigured,
} from "../../../../lib/google-oauth";

/**
 * Démarre le flow OAuth Google : génère un state CSRF, le stocke dans un
 * cookie httpOnly court (10 min), redirige vers Google.
 *
 * Query `?next=/route` pour reprendre l'utilisateur où il en était après
 * callback (whitelist : doit commencer par / et pas //).
 */
export async function GET(req: Request) {
  if (!googleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth non configuré. Renseigne GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.local.",
      },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const nextRaw = url.searchParams.get("next") ?? "/account";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/account";

  const state = nanoid(24);
  const authUrl = buildAuthUrl(url.origin, state);
  const res = NextResponse.redirect(authUrl);
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  res.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
