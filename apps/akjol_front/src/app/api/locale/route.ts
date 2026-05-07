import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALE_COOKIE, isLocale } from "../../../i18n/config";

const Body = z.object({ locale: z.string() });

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success || !isLocale(parsed.data.locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, locale: parsed.data.locale });
  res.cookies.set(LOCALE_COOKIE, parsed.data.locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
