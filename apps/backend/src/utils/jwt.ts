import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import crypto from 'crypto';

export interface TokenPayload {
  adminId: number;
  username: string;
  email: string;
  jti?: string;
}

/**
 * Generates an access token for an admin user
 * @param payload The data to include in the JWT
 * @param expiresIn Token expiration time (e.g., '1h', '24h')
 * @returns A signed JWT string
 */
export const generateAccessToken = (payload: TokenPayload, expiresIn: string = '24h'): string => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: expiresIn as any });
};

/**
 * Generates a refresh token for an admin user
 * @param payload The data to include in the JWT
 * @param expiresIn Token expiration time (e.g., '7d')
 * @returns A signed JWT string
 */
export const generateRefreshToken = (payload: TokenPayload, expiresIn: string = '7d'): string => {
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ ...payload, jti }, config.JWT_SECRET, { expiresIn: expiresIn as any });
};

/**
 * Verifies a JWT and returns the decoded payload
 * @param token The JWT string to verify
 * @returns The decoded TokenPayload
 * @throws Error if the token is invalid or expired
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Refreshes an access token using a valid refresh token
 * @param refreshToken The refresh token string
 * @returns A new access token
 * @throws Error if the refresh token is invalid or expired
 */
export const refreshAccessToken = (refreshToken: string): string => {
  const payload = verifyToken(refreshToken);
  return generateAccessToken({
    adminId: payload.adminId,
    username: payload.username,
    email: payload.email
  });
};
