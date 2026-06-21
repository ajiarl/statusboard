import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Drizzle Kit needs Session pooler (port 5432) for migrations
// Runtime app uses Transaction pooler (port 6543) with prepare: false
const DATABASE_URL = process.env.DATABASE_URL_MIGRATE || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL or DATABASE_URL_MIGRATE environment variable is not set");
}

// Verify we're using Session pooler for migrations
if (DATABASE_URL.includes(":6543")) {
  console.warn("\n⚠️  WARNING: Using Transaction pooler (port 6543) for migrations");
  console.warn("   Drizzle Kit requires Session pooler (port 5432) for schema introspection");
  console.warn("   Add DATABASE_URL_MIGRATE with Session pooler URL to .env.local\n");
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
} satisfies Config;
