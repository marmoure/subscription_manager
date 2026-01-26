import type { Context, Next } from 'hono';

// In-memory rate limit store: Map<ip, { count: number, resetAt: number }>
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS_PER_WINDOW = 5; // Updated to 5 as per verification task

/**
 * Simple in-memory rate limiting middleware
 */
export const rateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();

  let rateLimit = rateLimitMap.get(ip);

  if (!rateLimit || now >= rateLimit.resetAt) {
    // New IP or Window expired, reset
    rateLimit = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW
    };
    rateLimitMap.set(ip, rateLimit);
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
      message: 'Too Many Requests: Rate limit exceeded. Please try again later.'
    }, 429);
  }

  rateLimit.count++;

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
