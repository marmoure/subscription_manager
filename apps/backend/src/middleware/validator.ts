import { z } from 'zod';
import type { Context, Next } from 'hono';

/**
 * Simple Zod validator middleware for Hono
 * Mimics @hono/zod-validator
 */
export const zValidator = (schema: z.ZodSchema) => async (c: Context, next: Next) => {
  try {
    const body = await c.req.json();
    const result = schema.safeParse(body);
    
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
    return c.json({
      success: false,
      message: 'Invalid JSON body'
    }, 400);
  }
};
