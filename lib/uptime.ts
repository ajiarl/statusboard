import { db } from "@/lib/db";
import { checks } from "@/lib/db/schema";
import { eq, gte, and, count, sql } from "drizzle-orm";

export async function calculateUptime(
  monitorId: string,
  windowHours: number
): Promise<number> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const result = await db
    .select({
      total: count(),
      up: count(
        sql`CASE WHEN ${checks.status} = 'up' THEN 1 END`
      ),
    })
    .from(checks)
    .where(
      and(
        eq(checks.monitorId, monitorId),
        gte(checks.checkedAt, since)
      )
    );

  const row = result[0];
  if (!row || row.total === 0) return 100;

  return Math.round((row.up / row.total) * 10000) / 100;
}
