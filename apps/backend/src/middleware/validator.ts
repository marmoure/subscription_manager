import { z } from 'zod';
import type { Context, Next } from 'hono';

type ValidationTarget = 'json' | 'query';

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
    }

    const result = schema.safeParse(data);
    
    if (!result.success) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten()
      }, 400);
    }
    
    // Store validated data in context for later use
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
