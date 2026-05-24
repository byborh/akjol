import Database from "better-sqlite3";
import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

/**
 * Driver DB conditionnel :
 *  - Si `TURSO_DATABASE_URL` est défini (prod sur Vercel/Turso) → @libsql/client
 *  - Sinon → better-sqlite3 sur le fichier passé en argument (dev local)
 *
 * Les deux drivers Drizzle exposent la même surface API (select / insert /
 * update / delete / transaction), donc tout le code repo / engines reste
 * inchangé. On expose le type parent `BaseSQLiteDatabase` qui est commun
 * aux deux dialectes — TS accepte uniformément les overloads complets.
 *
 * En prod, `TURSO_AUTH_TOKEN` est requis pour s'authentifier. Si absent et
 * URL définie, on logue un warning et on tente quand même (utile pour les
 * DB dev Turso sans token).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = BaseSQLiteDatabase<"sync" | "async", any, typeof schema>;

export function createDb(localPath: string): Db {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    if (!tursoToken) {
      console.warn(
        "[akjol/db] TURSO_DATABASE_URL set without TURSO_AUTH_TOKEN — assuming dev token-less DB.",
      );
    }
    const client = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return drizzleLibsql(client, { schema });
  }

  const sqlite = new Database(localPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzleBetterSqlite(sqlite, { schema });
}

export * from "./schema";
export * from "./repo";
