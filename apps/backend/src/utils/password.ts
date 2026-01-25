import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hashes a password using bcrypt.
 * @param password The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a hash using bcrypt.
 * @param password The plain text password to verify.
 * @param hash The hash to verify against.
 * @returns A promise that resolves to a boolean indicating if the password is valid.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
