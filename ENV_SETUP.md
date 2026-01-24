# Subscription Manager - Environment Setup

This project uses environment variables for configuration. Follow these steps to set up your environment:

## Quick Setup

1. Run the environment setup script:
```bash
npm run setup:env
```

This will create:
- `apps/backend/src/config/` directory
- `apps/backend/src/config/env.ts` with Zod validation
- Configuration files are already created (`.env` and `.env.example`)

2. Update the `.env` files with your actual values:
   - `apps/backend/.env` - Backend configuration
   - `apps/frontend/.env` - Frontend configuration

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | SQLite database file path | Yes | `file:./dev.db` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Yes | - |
| `API_KEY_SECRET` | Secret key for API keys (min 32 chars) | Yes | - |
| `PORT` | Server port number | No | `3000` |
| `NODE_ENV` | Environment mode | No | `development` |
| `CORS_ORIGIN` | Allowed CORS origin URL | No | `http://localhost:5173` |
| `SMTP_HOST` | SMTP server hostname | Yes | - |
| `SMTP_PORT` | SMTP server port | No | `587` |
| `SMTP_SECURE` | Use TLS for SMTP | No | `false` |
| `SMTP_USER` | SMTP username/email | Yes | - |
| `SMTP_PASS` | SMTP password | Yes | - |
| `SMTP_FROM` | Default "from" email address | Yes | - |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key | Yes | - |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret key | Yes | - |

### Frontend (`apps/frontend/.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `http://localhost:3000` |
| `VITE_RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key (public) | Yes | - |

## Environment Validation

The backend uses **Zod** for runtime environment variable validation. On startup, the application will:

1. Load variables from `.env` file
2. Validate them against the schema defined in `src/config/env.ts`
3. Transform and parse values (e.g., string to number for PORT)
4. Throw descriptive errors if validation fails

Example error output:
```
🚨 Environment variable validation failed:

  ❌ JWT_SECRET: JWT_SECRET must be at least 32 characters for security
  ❌ SMTP_USER: SMTP_USER must be a valid email address
  ❌ DATABASE_URL: DATABASE_URL is required

💡 Please check your .env file and ensure all required variables are set correctly.
```

## Using the Config

Import the validated config object in your code:

```typescript
import { config, isProduction, isDevelopment } from './config/env';

// Type-safe access to environment variables
console.log(config.DATABASE_URL);
console.log(config.PORT); // Already parsed as number

// Helper functions
if (isProduction) {
  // Production-only logic
}
```

## Security Notes

- **Never commit `.env` files** to version control (already in `.gitignore`)
- Use `.env.example` as a template for required variables
- Generate strong secrets for `JWT_SECRET` and `API_KEY_SECRET` (min 32 characters)
- In production, use environment-specific secrets (not the dev values)
- Store production secrets in a secure secrets manager (e.g., AWS Secrets Manager, Azure Key Vault)
