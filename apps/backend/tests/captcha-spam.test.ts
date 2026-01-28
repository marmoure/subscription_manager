import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.RECAPTCHA_SECRET_KEY = 'test-secret';

import { app } from '../src/index';
import { client } from '../src/db/db';

// Mock global fetch
global.fetch = jest.fn() as any;

describe('CAPTCHA and Spam Prevention Tests', () => {
  const RUN_ID = Date.now().toString(36);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    client.close();
  });

  describe('CAPTCHA Validation', () => {
    const payload = {
      name: 'Captcha Test',
      machineId: `MACHINECAPTCHA${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, ''),
      phone: '1234567890',
      shopName: 'Captcha Shop',
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
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] })
      });

      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...payload, captchaToken: 'invalid-token' })
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toContain('CAPTCHA verification failed');
    });

    it('should accept submission with valid test token in test env', async () => {
      // No fetch call expected due to test-token bypass
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...payload, machineId: `MACHINECAPTCHASUCCESS${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, '') })
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Spam Prevention - Duplicate Submissions', () => {
    it('should reject duplicate submissions for the same machine ID', async () => {
      const machineId = `MACHINEDUPLICATE${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, '');
      const payload = {
        name: 'Duplicate Test',
        machineId,
        phone: '1234567890',
        shopName: 'Duplicate Shop',
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
          machineId: `MACHINEBOT${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, ''),
          phone: '1234567890',
          shopName: 'Bot Shop',
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
