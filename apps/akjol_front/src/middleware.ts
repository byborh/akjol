import { NextResponse, type NextRequest } from "next/server";
import { decodeSessionEdge, SESSION_COOKIE_NAME } from "./lib/session-edge";

/**
 * Gate /admin/* aux roles curator + admin. Sans session → redirect vers
 * /account?next=… ; session sans le bon rôle → /account?error=admin-required.
 *
 * Le matcher tient ces routes hors des assets statiques pour ne pas tuer
 * la perf — la vérif HMAC est rapide mais inutile sur /_next/static.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
