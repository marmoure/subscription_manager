import type { Context, Next } from 'hono';
import { config } from '../config/env';

/**
 * CAPTCHA verification middleware
 * Verifies the recaptcha token with Google's API
 */
export const verifyCaptcha = async (c: Context, next: Next) => {
  try {
    const validatedData = c.get('validated' as any);
    const token = validatedData?.captchaToken;

    if (!token) {
      return c.json({
        success: false,
        message: 'CAPTCHA token is required'
      }, 400);
    }

    // Bypass CAPTCHA verification in non-production environments with a test token
    if (config.NODE_ENV !== 'production' && token === 'test-token') {
      return await next();
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${config.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json() as { success: boolean, 'error-codes'?: string[] };

    if (!data.success) {
      return c.json({
        success: false,
        message: 'CAPTCHA verification failed',
        errors: data['error-codes']
      }, 400);
    }

    await next();
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return c.json({
      success: false,
      message: 'An error occurred during CAPTCHA verification'
    }, 500);
  }
};
