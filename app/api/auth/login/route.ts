import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";

/**
 * In-memory rate limiter
 * Format: Map<IP, { count: number, resetAt: number }>
 *
 * Rate limit: 5 requests per minute per IP (sesuai IMPLEMENTATION.md Fase 1)
 * In-memory cukup untuk MVP single-instance. Kalau scale horizontal perlu Redis.
 */
const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

const RATE_LIMIT_MAX = 5; // requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 menit dalam ms

/**
 * Check rate limit untuk IP tertentu
 */
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Kalau belum ada record atau sudah lewat window, reset
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  // Kalau belum mencapai limit, increment
  if (record.count < RATE_LIMIT_MAX) {
    record.count++;
    return { allowed: true };
  }

  // Kalau sudah mencapai limit, reject
  const retryAfter = Math.ceil((record.resetAt - now) / 1000);
  return { allowed: false, retryAfter };
}

/**
 * Cleanup rate limit map setiap 5 menit untuk hindari memory leak
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * POST /api/auth/login
 *
 * Body: { password: string }
 * Response:
 *   - 200 + redirect ke /admin kalau berhasil
 *   - 401 kalau password salah
 *   - 429 kalau rate limit exceeded
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter?.toString() || "60",
          },
        }
      );
    }

    // 2. Parse body
    const body = await request.json();
    const { password } = body;

    // 3. Validasi input
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // 4. Verifikasi password
    const isValid = await verifyPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // 5. Buat session (set cookie)
    await createSession();

    // 6. Return success dengan redirect
    // Frontend akan handle redirect ke /admin
    return NextResponse.json(
      { success: true, redirectTo: "/admin" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
