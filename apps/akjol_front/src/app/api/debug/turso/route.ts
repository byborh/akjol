import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { createDb } from "@akjol/db";

/**
 * Endpoint de diag temporaire — à supprimer une fois le bug Vercel/Turso fix.
 * GET /api/debug/turso → retourne ce que le runtime voit vraiment.
 *
 * Aucun secret n'est exposé : on log uniquement scheme/host/length, pas les
 * valeurs réelles du token ni le contenu des rows.
 */
export async function GET() {
  const url = process.env.TURSO_DATABASE_URL ?? "";
  const token = process.env.TURSO_AUTH_TOKEN ?? "";

  const info: Record<string, unknown> = {
    nodeVersion: process.version,
    urlPresent: Boolean(url),
    urlScheme: url.split(":")[0] || "(missing)",
    urlHostPrefix: url.replace(/^[a-z]+:\/\//, "").slice(0, 25) + "…",
    urlLength: url.length,
    tokenPresent: Boolean(token),
    tokenLength: token.length,
    tokenJwtParts: token.split(".").length,
  };

  if (!url || !token) {
    return NextResponse.json({ ok: false, reason: "missing_env", info });
  }

  try {
    const db = createDb("./data/akjol.db");
    const rows = (await db.all(sql.raw("SELECT COUNT(*) as n FROM users"))) as Array<{
      n: number;
    }>;
    info.userCount = rows[0]?.n;
    return NextResponse.json({ ok: true, info });
  } catch (err) {
    const e = err as {
      message?: string;
      code?: string;
      cause?: { message?: string; status?: number };
    };
    return NextResponse.json({
      ok: false,
      reason: "libsql_threw",
      info,
      error: {
        message: e?.message,
        code: e?.code,
        causeMessage: e?.cause?.message,
        causeStatus: e?.cause?.status,
      },
    });
  }
}
