import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

process.env.NODE_ENV = 'test';

import { app } from '../src/index';
import { db, client } from '../src/db/db';
import { apiKeys } from '../src/db/schema';
import { eq } from 'drizzle-orm';

describe('Rate Limiting Tests', () => {
  const TEST_API_KEY = 'test-api-key-for-rate-limiting';
  const RUN_ID = Date.now().toString(36);

  beforeAll(async () => {
    // Ensure we have a test API key in the DB
    try {
      const existing = await db.select().from(apiKeys).where(eq(apiKeys.key, TEST_API_KEY)).get();
      if (!existing) {
        await db.insert(apiKeys).values({
          key: TEST_API_KEY,
          name: 'Test API Key',
          isActive: true,
        });
      }
    } catch (e) {
      console.error('Failed to setup test API key', e);
    }
  });

  afterAll(async () => {
    client.close();
  });

  describe('Public Form Rate Limiting', () => {
    it('should allow 5 requests and rate limit the next 5', async () => {
      const ip = '1.2.3.4';
      const payload = {
        name: 'Test User',
        machineId: 'MACHINERATELIMIT1',
        phone: '1234567890',
        shopName: 'Test Shop',
        numberOfCashiers: 1,
        captchaToken: 'test-token'
      };

      for (let i = 0; i < 10; i++) {
        const currentPayload = { ...payload, machineId: `MACHINERLPUBLIC${RUN_ID}${i}`.replace(/[^a-zA-Z0-9]/g, '') };

        const res = await app.request('/api/public/submit-license-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          },
          body: JSON.stringify(currentPayload)
        });

        if (i < 5) {
          expect(res.status).toBe(201);
          expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
          expect(res.headers.get('X-RateLimit-Remaining')).toBe((4 - i).toString());
        } else {
          expect(res.status).toBe(429);
          const data = (await res.json()) as any;
          expect(data.message).toContain('Too Many Requests');
          expect(res.headers.get('Retry-After')).toBeDefined();
        }
      }
    });

    it('should not interfere with different IPs', async () => {
      const ip2 = '1.2.3.5';
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': ip2
        },
        body: JSON.stringify({
          name: 'Test User 2',
          machineId: `MACHINERLPUBLICDIFFIP${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, ''),
          phone: '1234567890',
          shopName: 'Test Shop',
          numberOfCashiers: 1,
          captchaToken: 'test-token'
        })
      });
      expect(res.status).toBe(201);
    });
  });

  describe('API Endpoint Rate Limiting', () => {
    it('should allow 100 requests and rate limit the next 50', async () => {
      for (let i = 0; i < 150; i++) {
        const res = await app.request('/api/v1/verify-license', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': TEST_API_KEY
          },
          body: JSON.stringify({
            machineId: `ANYMACHINE${RUN_ID}${i}`.replace(/[^a-zA-Z0-9]/g, '')
          })
        });

        if (i < 100) {
          expect(res.status).not.toBe(429);
          expect(res.headers.get('X-RateLimit-Limit')).toBe('100');
          expect(res.headers.get('X-RateLimit-Remaining')).toBe((99 - i).toString());
        } else {
          expect(res.status).toBe(429);
          expect(res.headers.get('Retry-After')).toBeDefined();
        }
      }
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset after the window passes', async () => {
      const now = Date.now();
      const dateSpy = jest.spyOn(Date, 'now');

      try {
        const ip = '2.2.2.2';

        for (let i = 0; i < 5; i++) {
          await app.request('/api/public/submit-license-request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': ip
            },
            body: JSON.stringify({
              name: 'Reset Test',
              machineId: `RESETTEST${RUN_ID}${i}`.replace(/[^a-zA-Z0-9]/g, ''),
              phone: '1234567890',
              shopName: 'Shop',
              numberOfCashiers: 1,
              captchaToken: 'test-token'
            })
          });
        }

        const resLimit = await app.request('/api/public/submit-license-request', {
          method: 'POST',
          headers: { 'X-Forwarded-For': ip, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Limit Test',
            machineId: `LIMITTEST${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, ''),
            phone: '1234567890',
            shopName: 'Shop',
            numberOfCashiers: 1,
            captchaToken: 'test-token'
          })
        });
        expect(resLimit.status).toBe(429);

        dateSpy.mockReturnValue(now + 16 * 60 * 1000);

        const resReset = await app.request('/api/public/submit-license-request', {
          method: 'POST',
          headers: {
            'X-Forwarded-For': ip,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Reset Test 2',
            machineId: `RESETTESTAFTER${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, ''),
            phone: '1234567890',
            shopName: 'Shop',
            numberOfCashiers: 1,
            captchaToken: 'test-token'
          })
        });
        expect(resReset.status).toBe(201);

      } finally {
        dateSpy.mockRestore();
      }
    });
  });
});
