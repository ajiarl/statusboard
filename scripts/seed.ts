import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { monitors, checks } from "../lib/db/schema";
import { checkMonitor } from "../lib/check";

export const REAL_MONITORS = [
  {
    name: "Portfolio Utama",
    url: "https://ajiarlando.my.id",
    method: "GET" as const,
    expectedStatus: 200,
    isActive: true,
  },
  {
    name: "Snip URL Shortener",
    url: "https://snipid.my.id",
    method: "GET" as const,
    expectedStatus: 200,
    isActive: true,
  },
  {
    name: "JIERjoki Service",
    url: "https://web-joki-tugas.vercel.app",
    method: "GET" as const,
    expectedStatus: 200,
    isActive: true,
  },
  {
    name: "KosPedia Palembang",
    url: "https://kospedia-palembang.vercel.app",
    method: "GET" as const,
    expectedStatus: 200,
    isActive: true,
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
      let monitorId: string;

      const [existing] = await db
        .select()
        .from(monitors)
        .where(eq(monitors.url, item.url))
        .limit(1);

      if (!existing) {
        const [inserted] = await db
          .insert(monitors)
          .values({
            name: item.name,
            url: item.url,
            method: item.method,
            expectedStatus: item.expectedStatus,
            isActive: item.isActive,
            currentStatus: "up",
            consecutiveFailures: 0,
          })
          .returning({ id: monitors.id });
        monitorId = inserted.id;
        console.log(`  ✓ Inserted monitor: ${item.name} (${item.url})`);
        insertedCount++;
      } else {
        monitorId = existing.id;
        await db
          .update(monitors)
          .set({
            name: item.name,
            method: item.method,
            expectedStatus: item.expectedStatus,
            isActive: item.isActive,
          })
          .where(eq(monitors.id, existing.id));
        console.log(`  ↺ Verified monitor: ${item.name} (${item.url})`);
        existingCount++;
      }

      // Jalankan initial real ping HTTP dan simpan check pertama
      try {
        const checkResult = await checkMonitor({
          id: monitorId,
          name: item.name,
          url: item.url,
          method: item.method,
          expectedStatus: item.expectedStatus,
          isActive: item.isActive,
          currentStatus: "up",
          consecutiveFailures: 0,
          lastCheckedAt: null,
          createdAt: new Date(),
        });

        await db.insert(checks).values({
          monitorId,
          status: checkResult.status,
          statusCode: checkResult.statusCode,
          responseTimeMs: checkResult.responseTimeMs,
        });

        await db
          .update(monitors)
          .set({
            currentStatus: checkResult.status,
            lastCheckedAt: new Date(),
          })
          .where(eq(monitors.id, monitorId));

        console.log(
          `    ↳ Live check: ${checkResult.status.toUpperCase()} (${checkResult.responseTimeMs}ms, status: ${checkResult.statusCode})`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`    ⚠ Initial ping failed for ${item.name}: ${msg}`);
      }
    }

    console.log(
      `\n✅ Seeding complete: ${insertedCount} inserted, ${existingCount} verified/updated. Real telemetry recorded.`
    );
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
