/**
 * Promote un user existant au rôle curator (ou admin). Idempotent.
 *
 * Usage :
 *   pnpm promote:curator user@example.com
 *   pnpm promote:curator user@example.com --role=admin
 *
 * Le user doit déjà exister (créé au premier login via /api/auth/login).
 * Après promotion il doit se déconnecter / reconnecter pour que le cookie
 * de session embarque le nouveau rôle.
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { createDb, users } from "@akjol/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

function parseArgs(): { email: string; role: "curator" | "admin" } {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"));
  if (!email) {
    console.error("Usage : pnpm promote:curator <email> [--role=curator|admin]");
    process.exit(1);
  }
  const roleArg = args.find((a) => a.startsWith("--role="));
  const role = roleArg ? roleArg.split("=")[1] : "curator";
  if (role !== "curator" && role !== "admin") {
    console.error(`Rôle invalide : ${role}. Attendu : curator | admin.`);
    process.exit(1);
  }
  return { email: email.trim().toLowerCase(), role };
}

async function main() {
  const { email, role } = parseArgs();
  const db = createDb(DB_PATH);

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!existing[0]) {
    console.error(`User ${email} introuvable. Il doit d'abord se connecter au moins une fois.`);
    process.exit(2);
  }

  await db.update(users).set({ role }).where(eq(users.email, email));
  console.log(`OK — ${email} est maintenant ${role} (relance la session pour rafraîchir le cookie).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
