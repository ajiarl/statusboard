import bcrypt from "bcryptjs";

/**
 * Verify plain password against the stored hash
 * @param plainPassword - Password yang diinput user
 * @returns Promise<boolean> - true kalau password cocok
 */
export async function verifyPassword(plainPassword: string): Promise<boolean> {
  const hash = process.env.OWNER_PASSWORD_HASH;
  if (!hash) {
    console.error(
      "OWNER_PASSWORD_HASH environment variable is not set. " +
      'Generate one with: node -e "require(\'bcryptjs\').hash(\'your-password\', 12).then(console.log)"'
    );
    return false;
  }
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

