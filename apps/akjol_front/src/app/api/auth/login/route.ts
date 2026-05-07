import { NextResponse } from "next/server";
import { z } from "zod";
import { encodeSession, isValidEmail, SESSION_COOKIE } from "../../../../lib/session";

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

  const token = encodeSession({ email, name, iat: Math.floor(Date.now() / 1000) });
  const res = NextResponse.json({ ok: true, user: { email, name } });
  res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
  return res;
}
