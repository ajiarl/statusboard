import type { InferSelectModel } from "drizzle-orm";
import type { monitors } from "@/lib/db/schema";
import { isPrivateUrl } from "@/lib/ssrf";

type Monitor = InferSelectModel<typeof monitors>;

export interface CheckResult {
  status: "up" | "down" | "degraded";
  statusCode: number | null;
  responseTimeMs: number;
}

const TIMEOUT_MS = 10_000;

export async function checkMonitor(monitor: Monitor): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = performance.now();

  try {
    let currentUrl = monitor.url;
    let redirectsCount = 0;
    const maxRedirects = 5;
    let lastResponseStatus: number | null = null;
    let currentMethod = monitor.method;

    while (true) {
      if (isPrivateUrl(currentUrl)) {
        const responseTimeMs = Math.round(performance.now() - start);
        return { status: "down", statusCode: lastResponseStatus, responseTimeMs };
      }

      const res = await fetch(currentUrl, {
        method: currentMethod,
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "StatusBoard/1.0",
        },
      });

      lastResponseStatus = res.status;

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          const responseTimeMs = Math.round(performance.now() - start);
          return { status: "down", statusCode: res.status, responseTimeMs };
        }

        const location = res.headers.get("location");
        if (!location) {
          break;
        }

        const resolvedUrl = new URL(location, currentUrl).toString();
        currentUrl = resolvedUrl;

        if ([301, 302, 303].includes(res.status)) {
          if (currentMethod !== "HEAD") {
            currentMethod = "GET";
          }
        }
        continue;
      }

      break;
    }

    const responseTimeMs = Math.round(performance.now() - start);
    let status: "up" | "down" | "degraded";
    if (lastResponseStatus === monitor.expectedStatus) {
      status = responseTimeMs > 3000 ? "degraded" : "up";
    } else {
      status = "down";
    }

    return { status, statusCode: lastResponseStatus, responseTimeMs };
  } catch {
    const responseTimeMs = Math.round(performance.now() - start);
    return { status: "down", statusCode: null, responseTimeMs };
  } finally {
    clearTimeout(timer);
  }
}
