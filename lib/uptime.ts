import { db } from "@/lib/db";
import { checks } from "@/lib/db/schema";
import { eq, gte, and, count, sql, asc } from "drizzle-orm";
import type { DailyHeartbeat, HeartbeatStatus } from "@/lib/types/status";

export async function calculateUptime(
  monitorId: string,
  windowHours: number
): Promise<number> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const result = await db
    .select({
      total: count(),
      up: count(
        sql`CASE WHEN ${checks.status} != 'down' THEN 1 END`
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

export async function calculateDailyHeartbeats(
  monitorId: string,
  days: number = 90
): Promise<{ heartbeats: DailyHeartbeat[]; avgLatencyMs: number | null }> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dailyRows = await db
    .select({
      date: sql<string>`DATE(${checks.checkedAt})::text`,
      total: count(),
      up: count(sql`CASE WHEN ${checks.status} = 'up' THEN 1 END`),
      degraded: count(sql`CASE WHEN ${checks.status} = 'degraded' THEN 1 END`),
      down: count(sql`CASE WHEN ${checks.status} = 'down' THEN 1 END`),
      avgLatency: sql<number | null>`ROUND(AVG(${checks.responseTimeMs}))`,
    })
    .from(checks)
    .where(
      and(
        eq(checks.monitorId, monitorId),
        gte(checks.checkedAt, since)
      )
    )
    .groupBy(sql`DATE(${checks.checkedAt})`)
    .orderBy(asc(sql`DATE(${checks.checkedAt})`));

  const mapByDate = new Map<
    string,
    {
      total: number;
      up: number;
      degraded: number;
      down: number;
      avgLatency: number | null;
    }
  >();

  let totalLatencySum = 0;
  let totalLatencyCount = 0;

  for (const row of dailyRows) {
    const total = Number(row.total);
    const avg = row.avgLatency !== null ? Number(row.avgLatency) : null;
    mapByDate.set(row.date, {
      total,
      up: Number(row.up),
      degraded: Number(row.degraded),
      down: Number(row.down),
      avgLatency: avg,
    });
    if (avg !== null && !isNaN(avg)) {
      totalLatencySum += avg * total;
      totalLatencyCount += total;
    }
  }

  const overallAvgLatency =
    totalLatencyCount > 0 ? Math.round(totalLatencySum / totalLatencyCount) : null;

  // Bangun 90 hari sekuensial sampai hari ini
  const heartbeats: DailyHeartbeat[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];

    const data = mapByDate.get(dateStr);
    if (!data || data.total === 0) {
      heartbeats.push({
        date: dateStr,
        status: "none",
        uptimePct: 0,
        avgLatencyMs: null,
      });
    } else {
      const uptimePct = Math.round(((data.up + data.degraded) / data.total) * 10000) / 100;
      let status: HeartbeatStatus = "up";
      if (data.down > 0) {
        status = (data.up + data.degraded) === 0 ? "down" : "degraded";
      } else if (data.degraded > 0) {
        status = (data.degraded / data.total) >= 0.5 ? "degraded" : "up";
      }

      heartbeats.push({
        date: dateStr,
        status,
        uptimePct,
        avgLatencyMs: data.avgLatency,
      });
    }
  }

  return {
    heartbeats,
    avgLatencyMs: overallAvgLatency,
  };
}
