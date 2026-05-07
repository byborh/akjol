import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE.name, "", { ...SESSION_COOKIE.options, maxAge: 0 });
  return res;
}
