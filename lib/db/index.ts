import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  try {
    // Fallback for standalone scripts and test runners where Next.js hasn't preloaded .env
    const dotenv = require("dotenv");
    const path = require("path");
    dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
  } catch {
    // Ignore if dotenv is not available in production runtime
  }
}

const connectionString =
  process.env.DATABASE_URL || "postgres://postgres:***@127.0.0.1:5432/statusboard";

if (!process.env.DATABASE_URL) {
  console.warn("[db] DATABASE_URL is not set. Database operations will fail or fallback.");
}

const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client, { schema });
