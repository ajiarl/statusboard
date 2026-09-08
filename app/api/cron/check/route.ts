import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitors, checks } from "@/lib/db/schema";
import { checkMonitor } from "@/lib/check";
import { isPrivateUrl } from "@/lib/ssrf";
import { eq, lt } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeMonitors = await db
      .select()
      .from(monitors)
      .where(eq(monitors.isActive, true));

    if (activeMonitors.length === 0) {
      return NextResponse.json({ message: "No active monitors", checked: 0 });
    }

    const results = await Promise.allSettled(
      activeMonitors.map(async (monitor) => {
        // Pre-flight SSRF & DNS rebinding validation
        if (await isPrivateUrl(monitor.url)) {
          const failCount = monitor.consecutiveFailures + 1;
          const newStatus = failCount >= 2 ? "down" : monitor.currentStatus;

          await db.insert(checks).values({
            monitorId: monitor.id,
            status: "down",
            statusCode: null,
            responseTimeMs: 0,
          });

          await db
            .update(monitors)
            .set({
              consecutiveFailures: failCount,
              currentStatus: newStatus,
              lastCheckedAt: new Date(),
            })
            .where(eq(monitors.id, monitor.id));

          return {
            monitorId: monitor.id,
            name: monitor.name,
            status: "down" as const,
            statusCode: null,
            responseTimeMs: 0,
            consecutiveFailures: failCount,
            currentStatus: newStatus,
          };
        }

        const result = await checkMonitor(monitor);

        await db.insert(checks).values({
          monitorId: monitor.id,
          status: result.status,
          statusCode: result.statusCode,
          responseTimeMs: result.responseTimeMs,
        });

        let newConsecutiveFailures = monitor.consecutiveFailures;
        let newCurrentStatus = monitor.currentStatus;

        if (result.status === "down") {
          newConsecutiveFailures += 1;
          if (newConsecutiveFailures >= 2) {
            newCurrentStatus = "down";
          }
        } else {
          newConsecutiveFailures = 0;
          newCurrentStatus = result.status;
        }

        await db
          .update(monitors)
          .set({
            consecutiveFailures: newConsecutiveFailures,
            currentStatus: newCurrentStatus,
            lastCheckedAt: new Date(),
          })
          .where(eq(monitors.id, monitor.id));

        return {
          monitorId: monitor.id,
          name: monitor.name,
          ...result,
          consecutiveFailures: newConsecutiveFailures,
          currentStatus: newCurrentStatus,
        };
      })
    );

    const summary = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { error: String((r as PromiseRejectedResult).reason) }
    );

    const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    await db.delete(checks).where(lt(checks.checkedAt, cutoff));

    return NextResponse.json({ checked: activeMonitors.length, results: summary });
  } catch (error) {
    console.error("Cron check database or check error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
