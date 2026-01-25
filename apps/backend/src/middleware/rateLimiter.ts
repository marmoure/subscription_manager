import type { Context, Next } from 'hono';

// In-memory rate limit store: Map<ip, { count: number, resetAt: number }>
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS_PER_WINDOW = 5000000; // TODO: change this

/**
 * Simple in-memory rate limiting middleware
 */
export const rateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const rateLimit = rateLimitMap.get(ip);

  if (rateLimit) {
    if (now < rateLimit.resetAt) {
      if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
        return c.json({
          success: false,
          message: 'Too Many Requests: Rate limit exceeded. Please try again later.'
        }, 429);
      }
      rateLimit.count++;
    } else {
      // Window expired, reset
      rateLimitMap.set(ip, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW
      });
    }
  } else {
    // New IP
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    });
  }

  // Cleanup map periodically to prevent memory leaks
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  await next();
};
