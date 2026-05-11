import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeSession, SESSION_COOKIE } from "../../../lib/session";

export async function GET() {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE.name)?.value;
  const session = decodeSession(token);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      since: session.iat,
    },
  });
}
