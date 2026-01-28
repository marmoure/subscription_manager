import { z } from 'zod';
import type { Context, Next } from 'hono';

type ValidationTarget = 'json' | 'query' | 'param';

/**
 * Simple Zod validator middleware for Hono
 * Mimics @hono/zod-validator
 */
export const zValidator = (target: ValidationTarget, schema: z.ZodSchema) => async (c: Context, next: Next) => {
  try {
    let data: any;

    if (target === 'json') {
      data = await c.req.json();
    } else if (target === 'query') {
      data = c.req.query();
    } else if (target === 'param') {
      data = c.req.param();
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten()
      }, 400);
    }

    // Store validated data in context with target-specific key to prevent overwriting
    const contextKey = `validated${target.charAt(0).toUpperCase() + target.slice(1)}` as any;
    c.set(contextKey, result.data);

    // Also store in 'validated' for backward compatibility (will be overwritten by last validator)
    c.set('validated' as any, result.data);

    await next();
  } catch (error) {
    if (target === 'json') {
      return c.json({
        success: false,
        message: 'Invalid JSON body'
      }, 400);
    }

    return c.json({
      success: false,
      message: 'Validation error',
      error: error instanceof Error ? error.message : String(error)
    }, 400);
  }
};
