import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "./lib/session";

/**
 * Next.js 16 Proxy (bukan middleware.ts — lihat AGENTS.md line 21-23)
 *
 * Proteksi:
 * - Semua route /admin/* kecuali /admin/login → redirect ke /admin/login kalau belum login
 * - Semua API mutation (POST/PATCH/DELETE) kecuali /api/auth/* dan /api/cron/* → 401 kalau belum login
 * - Route publik (/, /api cron, /api auth) tetap bisa diakses tanpa auth
 *
 * (sesuai IMPLEMENTATION.md Fase 1 dan PRD §5.5)
 */

/**
 * Check if path is a protected admin route
 */
function isProtectedAdminRoute(pathname: string): boolean {
  // /admin/* protected, kecuali /admin/login
  return pathname.startsWith("/admin") && pathname !== "/admin/login";
}

/**
 * Check if path is a protected API mutation
 */
function isProtectedApiRoute(
  pathname: string,
  method: string
): boolean {
  // Hanya mutation methods yang perlu auth
  const isMutation = ["POST", "PATCH", "DELETE"].includes(method);
  if (!isMutation) {
    return false;
  }

  // /api/auth/* tidak perlu auth (ini endpoint auth itu sendiri)
  if (pathname.startsWith("/api/auth")) {
    return false;
  }

  // /api/cron/* tidak perlu auth via session (punya proteksi sendiri via X-Cron-Secret)
  if (pathname.startsWith("/api/cron")) {
    return false;
  }

  // Semua API mutation lainnya perlu auth
  return pathname.startsWith("/api");
}

/**
 * Next.js 16 proxy function (export name must be 'proxy', not 'middleware')
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Check if route requires authentication
  const needsAuth =
    isProtectedAdminRoute(pathname) ||
    isProtectedApiRoute(pathname, method);

  if (!needsAuth) {
    // Route publik, allow through
    return NextResponse.next();
  }

  // 2. Check authentication status
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    // 3a. Protected admin route tanpa auth → redirect ke login
    if (isProtectedAdminRoute(pathname)) {
      const loginUrl = new URL("/admin/login", request.url);
      // Simpan original URL untuk redirect after login (optional, bisa ditambah nanti)
      // loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 3b. Protected API route tanpa auth → 401
    if (isProtectedApiRoute(pathname, method)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  // 4. Authenticated, allow through
  return NextResponse.next();
}

/**
 * Config: define which routes this proxy applies to
 *
 * Matcher pattern:
 * - /admin/:path* — semua admin routes
 * - /api/:path* — semua API routes
 *
 * Publik routes (/, /login, dll) tidak masuk matcher, langsung skip proxy
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
  ],
};
