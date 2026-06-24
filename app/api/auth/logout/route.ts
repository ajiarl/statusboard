import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

/**
 * POST /api/auth/logout
 *
 * Destroy session cookie dan redirect ke /admin/login
 * (sesuai IMPLEMENTATION.md Fase 1)
 */
export async function POST() {
  try {
    // Destroy session cookie
    await destroySession();

    // Redirect ke login page
    // Frontend akan handle redirect, atau bisa pakai NextResponse.redirect
    return NextResponse.json(
      { success: true, redirectTo: "/admin/login" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
