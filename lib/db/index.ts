import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  try {
    // Fallback for standalone scripts and test runners where Next.js hasn't preloaded .env
    const dotenv = require("dotenv");
    const path = require("path");
    const fs = require("fs");
    const localEnv = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(localEnv)) {
      dotenv.config({ path: localEnv });
    } else {
      const parentEnv = path.resolve(process.cwd(), "../../.env.local");
      if (fs.existsSync(parentEnv)) {
        dotenv.config({ path: parentEnv });
      }
    }
  } catch {
    // Ignore if dotenv is not available in production runtime
  }
}

const connectionString = process.env.DATABASE_URL || "";

if (!process.env.DATABASE_URL) {
  console.warn("[db] DATABASE_URL is not set. Database operations will fail.");
}

const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client, { schema });
