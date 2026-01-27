import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable validation schema
 * Defines all required and optional environment variables with their types and constraints
 */
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // API Key Configuration
  API_KEY_SECRET: z.string().min(32, 'API_KEY_SECRET must be at least 32 characters for security'),

  // Server Configuration
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(65535, 'PORT must be between 1 and 65535')),

  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging'])
    .default('development'),

  // CORS Configuration
  CORS_ORIGIN: z
    .string()
    .url('CORS_ORIGIN must be a valid URL')
    .default('http://localhost:3000'),

  // CAPTCHA Configuration (Google reCAPTCHA)
  RECAPTCHA_SITE_KEY: z.string().min(1, 'RECAPTCHA_SITE_KEY is required'),

  RECAPTCHA_SECRET_KEY: z.string().min(1, 'RECAPTCHA_SECRET_KEY is required'),
});

/**
 * Validates environment variables against the schema
 * Throws descriptive errors if required variables are missing or invalid
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => {
        const path = err.path.join('.');
        return `  ❌ ${path}: ${err.message}`;
      });

      console.error('\n🚨 Environment variable validation failed:\n');
      console.error(errorMessages.join('\n'));
      console.error('\n💡 Please check your .env file and ensure all required variables are set correctly.\n');

      throw new Error('Invalid environment variables');
    }
    throw error;
  }
}

/**
 * Validated and typed configuration object
 * Export this throughout the application to access environment variables safely
 */
export const config = validateEnv();

/**
 * Type-safe configuration object type
 */
export type Config = typeof config;

/**
 * Helper to check if running in production
 */
export const isProduction = config.NODE_ENV === 'production';

/**
 * Helper to check if running in development
 */
export const isDevelopment = config.NODE_ENV === 'development';

/**
 * Helper to check if running in test mode
 */
export const isTest = config.NODE_ENV === 'test';
