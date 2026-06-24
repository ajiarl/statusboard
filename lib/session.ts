import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

// Session data interface
export interface SessionData {
  isLoggedIn: boolean;
}

// Session configuration
// SESSION_SECRET harus min 32 karakter (lihat PRD §5.5 dan IMPLEMENTATION.md Fase 1)
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error(
    "SESSION_SECRET environment variable must be set and at least 32 characters long"
  );
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "statusboard_session",
  cookieOptions: {
    httpOnly: true, // Tidak bisa diakses via JavaScript client-side (security)
    secure: process.env.NODE_ENV === "production", // HTTPS only di production
    sameSite: "lax", // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 hari (sesuai PRD §5.5)
  },
};

/**
 * Get the current session (creates new session if not exists)
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn === true;
}

/**
 * Create authenticated session (after successful login)
 */
export async function createSession(): Promise<void> {
  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();
}

/**
 * Destroy session (logout)
 */
export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
