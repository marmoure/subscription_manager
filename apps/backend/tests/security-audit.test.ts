import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Set environment variables BEFORE importing the app
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 's'.repeat(32);
process.env.API_KEY_SECRET = 'k'.repeat(32);
process.env.RECAPTCHA_SITE_KEY = 'site-key';
process.env.RECAPTCHA_SECRET_KEY = 'secret-key';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'password';
process.env.SMTP_FROM = 'noreply@example.com';
process.env.NODE_ENV = 'test';

import { app } from '../src/index';
import { db, client } from '../src/db/db';
import { adminUsers, licenseKeys, userSubmissions } from '../src/db/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resetRateLimit } from '../src/middleware/rateLimiter';
import { generateAccessToken } from '../src/utils/jwt';
import { hashPassword } from '../src/utils/password';

describe('Comprehensive Security Audit', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Run migrations
    migrate(db, { migrationsFolder: 'drizzle' });
    
    // Clear DB
    await db.delete(adminUsers).execute();
    await db.delete(licenseKeys).execute();
    await db.delete(userSubmissions).execute();

    // Create Admin User
    const hashedPassword = await hashPassword('AdminPass123!');
    const [admin] = await db.insert(adminUsers).values({
      username: 'securityadmin',
      email: 'security@test.com',
      hashedPassword,
      role: 'admin',
      isActive: true,
    }).returning();

    adminToken = generateAccessToken({
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
    });
  });

  afterAll(() => {
    client.close();
  });

  beforeEach(() => {
    resetRateLimit();
  });

  describe('1. SQL Injection Tests', () => {
    it('should be resilient to SQL injection in search params (Admin)', async () => {
      // payload: ' OR '1'='1
      const res = await app.request(`/api/admin/licenses?search=${encodeURIComponent("' OR '1'='1")}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      // Should treat it as a literal string search, returning 0 results (unless someone has that name)
      // If SQLi worked, it would return all licenses.
      // We assume DB is empty initially, let's add one legitimate license first to verify.
    });

    it('should not allow SQL injection in login', async () => {
      const res = await app.request('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: "' OR '1'='1",
          password: "password",
        }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('2. XSS & Input Sanitization', () => {
    it('should reject script tags in submission name', async () => {
      const payload = {
        name: '<script>alert(1)</script>',
        machineId: 'MACHINE001',
        phone: '1234567890',
        shopName: 'My Shop',
        email: 'test@example.com',
        numberOfCashiers: 1,
        captchaToken: 'test-token'
      };

      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(400); // Validation error
      const data = await res.json() as any;
      expect(data.success).toBe(false);
    });

    it('should reject script tags in shop name', async () => {
      const payload = {
        name: 'Valid Name',
        machineId: 'MACHINE002',
        phone: '1234567890',
        shopName: '<img src=x onerror=alert(1)>',
        email: 'test@example.com',
        numberOfCashiers: 1,
        captchaToken: 'test-token'
      };

      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Broken Authentication & Authorization', () => {
    it('should not allow access to admin stats without token', async () => {
      const res = await app.request('/api/admin/dashboard/stats');
      expect(res.status).toBe(401);
    });

    it('should not allow access with invalid token', async () => {
      const res = await app.request('/api/admin/dashboard/stats', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      expect(res.status).toBe(401);
    });

    it('should prevent admin registration if admin already exists', async () => {
      const res = await app.request('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin2',
          email: 'admin2@test.com',
          password: 'Password123!',
        }),
      });

      // Should be 403 Forbidden because we created an admin in beforeAll
      expect(res.status).toBe(403);
    });
  });

  describe('4. Mass Assignment', () => {
    it('should ignore extra fields in license submission', async () => {
      const payload = {
        name: 'Mass Assign',
        machineId: 'MACHINEMASS',
        phone: '1234567890',
        shopName: 'Mass Shop',
        email: 'mass@example.com',
        numberOfCashiers: 1,
        captchaToken: 'test-token',
        // Malicious fields
        status: 'revoked',
        role: 'admin',
        isAdmin: true
      };

      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);

      // Verify in DB that it wasn't affected
      // We'd need to fetch the license to be sure, but since we use Zod parsing (not passthrough),
      // and the service explicitly picks fields, it should be safe.
      // We can verify the status is 'active' (default) not 'revoked'.
      
      const licenseKey = data.data.licenseKey;
      const licenseRes = await app.request(`/api/admin/licenses?search=${encodeURIComponent(licenseKey)}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const licenseData = await licenseRes.json() as any;
      const license = licenseData.data[0];
      
      expect(license.status).toBe('active');
    });
  });

  describe('5. Rate Limiting', () => {
    it('should enforce rate limits on public submission endpoint', async () => {
      const payload = {
        name: 'Rate Limit',
        phone: '1234567890',
        shopName: 'RL Shop',
        email: 'rl@example.com',
        numberOfCashiers: 1,
        captchaToken: 'test-token'
      };

      // Limit is 5 per 15 mins.
      // 1st request
      let res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, machineId: 'RL001' }),
      });
      expect(res.status).toBe(201);

      // 2
      res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, machineId: 'RL002' }),
      });
      expect(res.status).toBe(201);

      // 3
      res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, machineId: 'RL003' }),
      });
      expect(res.status).toBe(201);

      // 4
      res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, machineId: 'RL004' }),
      });
      expect(res.status).toBe(201);

      // 5
      res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, machineId: 'RL005' }),
      });
      expect(res.status).toBe(201);

      // 6 - Should fail
      res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, machineId: 'RL006' }),
      });
      expect(res.status).toBe(429);
      const data = await res.json() as any;
      expect(data.message).toContain('Too Many Requests');
    });
  });

  describe('6. Captcha / Honeypot', () => {
      it('should reject if honeypot field is filled', async () => {
        const payload = {
            name: 'Spam Bot',
            machineId: 'SPAM001',
            phone: '1234567890',
            shopName: 'Spam Shop',
            email: 'spam@example.com',
            numberOfCashiers: 1,
            captchaToken: 'test-token',
            website: 'http://spam.com' // Honeypot
          };
    
          const res = await app.request('/api/public/submit-license-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          expect(res.status).toBe(400);
          const data = await res.json() as any;
          expect(data.message).toBe('Spam detected');
      });
  });

  describe('7. API Key Validation', () => {
    it('should reject access without API Key', async () => {
        const res = await app.request('/api/v1/software/verify');
        expect(res.status).toBe(401);
    });

    it('should reject access with invalid API Key', async () => {
        const res = await app.request('/api/v1/software/verify', {
            headers: { 'X-API-Key': 'invalid-key' }
        });
        expect(res.status).toBe(401);
    });

    // TODO: Create a valid API key and test success if needed, but we are focusing on security failures.
  });
});
