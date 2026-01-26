import { Context, Next } from 'hono';
import { db } from '../db/db';
import { apiKeys } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { getConnInfo } from '@hono/node-server/conninfo';

export type ApiKeyVariables = {
  apiKeyInfo: {
    id: number;
    key: string;
  }
}

interface ApiKeyCache {
  id: number;
  lastUsedAt: Date | null;
  isActive: boolean;
  usageCount: number;
  expiresAt: number;
}

// In-memory cache for valid API keys
const apiKeyCache = new Map<string, ApiKeyCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clears the API key cache. If a key is provided, only that key is cleared.
 * @param apiKey Optional API key to clear from cache
 */
export const clearApiKeyCache = (apiKey?: string) => {
  if (apiKey) {
    apiKeyCache.delete(apiKey);
  } else {
    apiKeyCache.clear();
  }
};

// Rate limiting: Map<apiKey, { count: number, resetAt: number }>
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 100; // Updated to 100 as per verification task

/**
 * Middleware to authenticate software API requests using API keys.
 * Extracts key from X-API-Key or Authorization: Bearer <key> headers.
 */
export const validateApiKey = async (c: Context<{ Variables: ApiKeyVariables }>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  let apiKey = c.req.header('X-API-Key');

  // Support both X-API-Key and Authorization: Bearer <key>
  if (!apiKey && authHeader?.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7);
  }

  if (!apiKey) {
    return c.json({ 
      success: false, 
      message: 'Unauthorized: Missing API Key' 
    }, 401);
  }

  // Security: Limit API key length to prevent DoS attacks with extremely long headers
  if (apiKey.length > 256) {
    return c.json({ 
      success: false, 
      message: 'Unauthorized: Invalid API Key format' 
    }, 401);
  }

  // 1. Rate Limiting Check
  const now = Date.now();
  let rateLimit = rateLimitMap.get(apiKey);

  if (!rateLimit || now >= rateLimit.resetAt) {
    // New Key or Reset window
    rateLimit = { 
      count: 0, 
      resetAt: now + RATE_LIMIT_WINDOW 
    };
    rateLimitMap.set(apiKey, rateLimit);
  }

  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - rateLimit.count);
  const resetSeconds = Math.ceil((rateLimit.resetAt - now) / 1000);

  // Set headers
  c.header('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  c.header('X-RateLimit-Remaining', Math.max(0, remaining - 1).toString());
  c.header('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000).toString());

  if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    c.header('Retry-After', resetSeconds.toString());
    return c.json({ 
      success: false, 
      message: 'Too Many Requests: Rate limit exceeded' 
    }, 429);
  }

  rateLimit.count++;

  // 2. Cache Check
  let keyData = apiKeyCache.get(apiKey);

  if (keyData && Date.now() > keyData.expiresAt) {
    apiKeyCache.delete(apiKey);
    keyData = undefined;
  }

  if (!keyData) {
    // 3. Database Validation
    try {
      const [dbKey] = await db.select()
        .from(apiKeys)
        .where(eq(apiKeys.key, apiKey))
        .limit(1);

      if (!dbKey || !dbKey.isActive) {
        return c.json({ 
          success: false, 
          message: 'Unauthorized: Invalid or inactive API Key' 
        }, 401);
      }

      keyData = {
        id: dbKey.id,
        lastUsedAt: dbKey.lastUsedAt,
        isActive: !!dbKey.isActive,
        usageCount: dbKey.usageCount,
        expiresAt: Date.now() + CACHE_TTL
      };

      // Add to cache
      apiKeyCache.set(apiKey, keyData);

    } catch (error) {
      console.error('Database error during API key validation:', error);
      return c.json({ 
        success: false, 
        message: 'Internal Server Error' 
      }, 500);
    }
  }

  // 4. Asynchronous Update (Last Used, Usage Count & IP Address)
  // We don't await this to keep the request fast
  let ipAddress = 'unknown';
  try {
    const info = getConnInfo(c);
    ipAddress = info.remote.address || 'unknown';
  } catch (error) {
    // Fallback for environments where getConnInfo fails (like some test setups)
    ipAddress = c.req.header('x-forwarded-for') || 'unknown';
  }

  db.update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      usageCount: sql`${apiKeys.usageCount} + 1`,
      lastIpAddress: ipAddress
    })
    .where(eq(apiKeys.key, apiKey))
    .execute()
    .catch(err => console.error('Failed to update API key usage:', err));

  // 5. Attach info to context for logging/downstream use
  c.set('apiKeyInfo', {
    id: keyData.id,
    key: apiKey.substring(0, 8) + '...', // Masked key for logging
  });

  await next();
};
