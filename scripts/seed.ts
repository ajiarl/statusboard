import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { monitors } from "../lib/db/schema";

export const REAL_MONITORS = [
  {
    name: "Portfolio Utama",
    url: "https://ajiarlando.my.id",
    method: "GET",
    expectedStatus: 200,
    isActive: true,
    currentStatus: "up",
  },
  {
    name: "Snip URL Shortener",
    url: "https://snip.ajiarlando.my.id",
    method: "GET",
    expectedStatus: 200,
    isActive: true,
    currentStatus: "up",
  },
  {
    name: "SiMagang Platform",
    url: "https://simagang.ajiarlando.my.id",
    method: "GET",
    expectedStatus: 200,
    isActive: true,
    currentStatus: "up",
  },
  {
    name: "Finance Tracker Service",
    url: "https://finance.ajiarlando.my.id",
    method: "GET",
    expectedStatus: 200,
    isActive: true,
    currentStatus: "up",
  },
  {
    name: "KosPedia API",
    url: "https://kospedia.ajiarlando.my.id",
    method: "GET",
    expectedStatus: 200,
    isActive: true,
    currentStatus: "up",
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL environment variable is not defined.");
    console.error("Please ensure .env or .env.local contains a valid PostgreSQL connection string.");
    process.exit(1);
  }

  console.log("🌱 Starting StatusBoard real data seeder...");
  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  try {
    let insertedCount = 0;
    let existingCount = 0;

    for (const item of REAL_MONITORS) {
      const [existing] = await db
        .select()
        .from(monitors)
        .where(eq(monitors.url, item.url))
        .limit(1);

      if (!existing) {
        await db.insert(monitors).values({
          name: item.name,
          url: item.url,
          method: item.method,
          expectedStatus: item.expectedStatus,
          isActive: item.isActive,
          currentStatus: item.currentStatus,
          consecutiveFailures: 0,
        });
        console.log(`  ✓ Inserted: ${item.name} (${item.url})`);
        insertedCount++;
      } else {
        await db
          .update(monitors)
          .set({
            name: item.name,
            method: item.method,
            expectedStatus: item.expectedStatus,
            isActive: item.isActive,
          })
          .where(eq(monitors.id, existing.id));
        console.log(`  ↺ Updated/Verified: ${item.name} (${item.url})`);
        existingCount++;
      }
    }

    console.log(
      `\n✅ Seeding complete: ${insertedCount} inserted, ${existingCount} verified/updated. Total 5 real monitors.`
    );
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
