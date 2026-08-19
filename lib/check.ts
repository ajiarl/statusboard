import type { InferSelectModel } from "drizzle-orm";
import type { monitors } from "@/lib/db/schema";

type Monitor = InferSelectModel<typeof monitors>;

export interface CheckResult {
  status: "up" | "down";
  statusCode: number | null;
  responseTimeMs: number;
}

const TIMEOUT_MS = 10_000;

export async function checkMonitor(monitor: Monitor): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = performance.now();

  try {
    const res = await fetch(monitor.url, {
      method: monitor.method,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "StatusBoard/1.0",
      },
    });

    const responseTimeMs = Math.round(performance.now() - start);
    const status = res.status === monitor.expectedStatus ? "up" : "down";

    return { status, statusCode: res.status, responseTimeMs };
  } catch {
    const responseTimeMs = Math.round(performance.now() - start);
    return { status: "down", statusCode: null, responseTimeMs };
  } finally {
    clearTimeout(timer);
  }
}
