import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/statusboard";

if (!process.env.DATABASE_URL) {
  console.warn("[db] DATABASE_URL is not set. Database operations will fail or fallback.");
}

const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client, { schema });
