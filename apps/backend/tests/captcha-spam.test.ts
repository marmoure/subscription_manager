import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { app } from '../src/index';
import { client } from '../src/db/db';

describe('CAPTCHA and Spam Prevention Tests', () => {
  const RUN_ID = Math.random().toString(36).substring(7);

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    client.close();
  });

  describe('CAPTCHA Validation', () => {
    const payload = {
      name: 'Captcha Test',
      machineId: `MACHINE-CAPTCHA-${RUN_ID}`,
      phone: '1234567890',
      shopName: 'Captcha Shop',
      email: 'captcha@example.com',
      numberOfCashiers: 1,
      captchaToken: 'test-token'
    };

    it('should reject submission without CAPTCHA token', async () => {
      const { captchaToken, ...payloadWithoutToken } = payload;
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadWithoutToken)
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toBe('Validation failed');
      expect(data.errors.fieldErrors.captchaToken).toBeDefined();
    });

    it('should reject submission with invalid CAPTCHA token', async () => {
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...payload, captchaToken: 'invalid-token' })
      });

      // Note: In test mode, it only bypasses if token === 'test-token'
      // Otherwise it tries to call Google API, which might fail or reject
      // Since we don't have a real secret key in tests, it should fail
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toContain('CAPTCHA verification failed');
    });

    it('should accept submission with valid test token in test env', async () => {
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...payload, machineId: `MACHINE-CAPTCHA-SUCCESS-${RUN_ID}` })
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });
  });

  describe('Spam Prevention - Duplicate Submissions', () => {
    it('should reject duplicate submissions for the same machine ID', async () => {
      const machineId = `MACHINE-DUPLICATE-${RUN_ID}`;
      const payload = {
        name: 'Duplicate Test',
        machineId,
        phone: '1234567890',
        shopName: 'Duplicate Shop',
        email: 'duplicate@example.com',
        numberOfCashiers: 1,
        captchaToken: 'test-token'
      };

      // First submission
      const res1 = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      expect(res1.status).toBe(201);

      // Second submission with same machine ID
      const res2 = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      expect(res2.status).toBe(409);
      const data2 = await res2.json() as any;
      expect(data2.message).toContain('already exists for this machine ID');
    });

    it('should reject submission if honeypot field is filled', async () => {
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '9.9.9.9'
        },
        body: JSON.stringify({
          name: 'Bot User',
          machineId: `MACHINE-BOT-${RUN_ID}`,
          phone: '1234567890',
          shopName: 'Bot Shop',
          email: 'bot@example.com',
          numberOfCashiers: 1,
          captchaToken: 'test-token',
          website: 'http://spam-bot.com'
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toBe('Spam detected');
    });
  });
});
