import { config as dotenvConfig } from "dotenv";
import type { Config } from "drizzle-kit";

// Charge les vars depuis .env.local en priorité, puis .env. Permet à
// `pnpm db:push` de pointer sur Turso quand TURSO_DATABASE_URL est défini,
// ou sur SQLite local sinon.
dotenvConfig({ path: ".env.local" });
dotenvConfig();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const config: Config = tursoUrl
  ? {
      schema: "./packages/db/src/schema.ts",
      out: "./packages/db/drizzle",
      dialect: "turso",
      dbCredentials: {
        url: tursoUrl,
        authToken: tursoToken,
      },
    }
  : {
      schema: "./packages/db/src/schema.ts",
      out: "./packages/db/drizzle",
      dialect: "sqlite",
      dbCredentials: {
        url: "./data/akjol.db",
      },
    };

export default config;
