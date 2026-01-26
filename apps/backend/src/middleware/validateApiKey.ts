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
}

// In-memory cache for valid API keys
const apiKeyCache = new Map<string, ApiKeyCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting: Map<apiKey, { count: number, resetAt: number }>
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

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

  // 1. Rate Limiting Check
  const now = Date.now();
  const rateLimit = rateLimitMap.get(apiKey);

  if (rateLimit) {
    if (now < rateLimit.resetAt) {
      if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
        return c.json({ 
          success: false, 
          message: 'Too Many Requests: Rate limit exceeded' 
        }, 429);
      }
      rateLimit.count++;
    } else {
      // Reset window
      rateLimitMap.set(apiKey, { 
        count: 1, 
        resetAt: now + RATE_LIMIT_WINDOW 
      });
    }
  } else {
    rateLimitMap.set(apiKey, { 
      count: 1, 
      resetAt: now + RATE_LIMIT_WINDOW 
    });
  }

  // 2. Cache Check
  let keyData = apiKeyCache.get(apiKey);

  if (!keyData) {
    // 3. Database Validation
    try {
      const [dbKey] = await db.select()
        .from(apiKeys)
        .where(eq(apiKeys.key, apiKey))
        .limit(1);

      if (!dbKey) {
        return c.json({ 
          success: false, 
          message: 'Unauthorized: Invalid API Key' 
        }, 401);
      }

      if (!dbKey.isActive) {
        return c.json({ 
          success: false, 
          message: 'Unauthorized: API Key is inactive' 
        }, 401);
      }

      keyData = {
        id: dbKey.id,
        lastUsedAt: dbKey.lastUsedAt,
        isActive: !!dbKey.isActive,
        usageCount: dbKey.usageCount
      };

      // Add to cache
      apiKeyCache.set(apiKey, keyData);
      
      // Auto-invalidate cache entry after TTL
      setTimeout(() => {
        apiKeyCache.delete(apiKey!);
      }, CACHE_TTL);

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
  const info = getConnInfo(c);
  const ipAddress = info.remote.address;

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
