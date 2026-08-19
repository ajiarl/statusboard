import bcrypt from "bcryptjs";

if (!process.env.OWNER_PASSWORD_HASH) {
  throw new Error(
    "OWNER_PASSWORD_HASH environment variable is not set. " +
    'Generate one with: node -e "require(\'bcryptjs\').hash(\'your-password\', 12).then(console.log)"'
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

