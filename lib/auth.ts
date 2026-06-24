import bcrypt from "bcryptjs";

/**
 * Verify password against hash stored in environment variable
 *
 * Auth model: Single owner, password hash disimpan di env var OWNER_PASSWORD_HASH
 * (lihat AGENTS.md line 49-54 dan PRD §5.5)
 *
 * Tidak ada tabel users di MVP — auth sengaja single-owner untuk self-hosting
 * yang paling ringan. Multi-user/Supabase Auth ada di roadmap v2.
 */

if (!process.env.OWNER_PASSWORD_HASH) {
  throw new Error(
    "OWNER_PASSWORD_HASH environment variable is not set. " +
    "Generate one with: node -e \"require('bcryptjs').hash('your-password', 12).then(console.log)\""
  );
}

const OWNER_PASSWORD_HASH = process.env.OWNER_PASSWORD_HASH;

/**
 * Verify plain password against the stored hash
 * @param plainPassword - Password yang diinput user
 * @returns Promise<boolean> - true kalau password cocok
 */
export async function verifyPassword(plainPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, OWNER_PASSWORD_HASH);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}
