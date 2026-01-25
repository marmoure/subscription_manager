import crypto from 'crypto';

/**
 * Generates a cryptographically secure API key.
 * @returns {string} A 64-character hexadecimal string.
 */
export const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
