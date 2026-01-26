import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { app } from '../src/index';
import { db, client } from '../src/db/db';
import { apiKeys } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { clearApiKeyCache } from '../src/middleware/validateApiKey';

describe('API Key Authentication and Authorization Logic', () => {
  const VALID_API_KEY = 'valid-test-api-key-1234567890';
  const INACTIVE_API_KEY = 'inactive-test-api-key-1234567890';
  const ANOTHER_VALID_KEY = 'another-valid-key-0987654321';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    // Setup test data
    await db.delete(apiKeys).execute();
    
    await db.insert(apiKeys).values([
      {
        key: VALID_API_KEY,
        name: 'Valid Key',
        isActive: true,
      },
      {
        key: INACTIVE_API_KEY,
        name: 'Inactive Key',
        isActive: false,
      },
      {
        key: ANOTHER_VALID_KEY,
        name: 'Another Valid Key',
        isActive: true,
      }
    ]).execute();
  });

  afterAll(async () => {
    await db.delete(apiKeys).execute();
    client.close();
  });

  beforeEach(() => {
    clearApiKeyCache();
  });

  describe('Authentication - Valid API Keys', () => {
    it('should allow request with valid API key in X-API-Key header', async () => {
      const res = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': VALID_API_KEY }
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });

    it('should allow request with valid API key in Authorization: Bearer format', async () => {
      const res = await app.request('/api/v1/software/verify', {
        headers: { 'Authorization': `Bearer ${VALID_API_KEY}` }
      });
      expect(res.status).toBe(200);
    });

    it('should prioritize X-API-Key over Authorization header if both present', async () => {
        // Use an invalid key in Authorization and valid in X-API-Key
        const res = await app.request('/api/v1/software/verify', {
          headers: { 
              'X-API-Key': VALID_API_KEY,
              'Authorization': 'Bearer invalid-key'
          }
        });
        expect(res.status).toBe(200);
    });
  });

  describe('Authentication - Rejection Cases', () => {
    it('should reject request with missing API key (401)', async () => {
      const res = await app.request('/api/v1/software/verify');
      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.message).toContain('Missing API Key');
    });

    it('should reject request with invalid/fake API key (401)', async () => {
      const res = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': 'completely-fake-key-that-does-not-exist' }
      });
      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.message).toContain('Invalid or inactive API Key');
    });

    it('should reject request with inactive API key (401)', async () => {
      const res = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': INACTIVE_API_KEY }
      });
      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.message).toContain('Invalid or inactive API Key');
    });

    it('should be case sensitive', async () => {
        const res = await app.request('/api/v1/software/verify', {
          headers: { 'X-API-Key': VALID_API_KEY.toUpperCase() }
        });
        expect(res.status).toBe(401);
    });
  });

  describe('Usage Tracking', () => {
    it('should update usage count and last used timestamp', async () => {
      const before = await db.select().from(apiKeys).where(eq(apiKeys.key, ANOTHER_VALID_KEY)).get();
      const initialCount = before?.usageCount || 0;

      await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': ANOTHER_VALID_KEY }
      });

      // Wait for async update to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const after = await db.select().from(apiKeys).where(eq(apiKeys.key, ANOTHER_VALID_KEY)).get();
      expect(after?.usageCount).toBe(initialCount + 1);
      expect(after?.lastUsedAt).toBeDefined();
      expect(after?.lastIpAddress).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should use cache for subsequent requests', async () => {
      const CACHE_KEY = 'cache-test-key';
      await db.insert(apiKeys).values({
        key: CACHE_KEY,
        name: 'Cache Key',
        isActive: true,
      }).execute();

      // First request - hits DB
      const res1 = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': CACHE_KEY }
      });
      expect(res1.status).toBe(200);

      // Modify DB to be inactive, but don't clear cache
      await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.key, CACHE_KEY)).execute();

      // Second request - should still succeed because it's in cache
      const res2 = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': CACHE_KEY }
      });
      expect(res2.status).toBe(200);

      // Clear cache
      clearApiKeyCache(CACHE_KEY);

      // Third request - should fail because it hits DB now
      const res3 = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': CACHE_KEY }
      });
      expect(res3.status).toBe(401);
      const data3 = await res3.json() as any;
      expect(data3.message).toContain('Invalid or inactive API Key');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const RL_KEY = 'rate-limit-key';
      await db.insert(apiKeys).values({
        key: RL_KEY,
        name: 'RL Key',
        isActive: true,
      }).execute();

      // The limit is 100
      for (let i = 0; i < 100; i++) {
        const res = await app.request('/api/v1/software/verify', {
          headers: { 'X-API-Key': RL_KEY }
        });
        expect(res.status).toBe(200);
      }

      const resLimit = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': RL_KEY }
      });
      expect(resLimit.status).toBe(429);
      expect(resLimit.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  describe('Concurrent Requests', () => {
      it('should handle concurrent requests correctly', async () => {
        const CONC_KEY = 'concurrent-key';
        await db.insert(apiKeys).values({
          key: CONC_KEY,
          name: 'Conc Key',
          isActive: true,
        }).execute();

        const requests = Array(10).fill(null).map(() => 
            app.request('/api/v1/software/verify', {
                headers: { 'X-API-Key': CONC_KEY }
            })
        );

        const responses = await Promise.all(requests);
        responses.forEach(res => {
            expect(res.status).toBe(200);
        });

        // Wait for async updates
        await new Promise(resolve => setTimeout(resolve, 500));

        const after = await db.select().from(apiKeys).where(eq(apiKeys.key, CONC_KEY)).get();
        expect(after?.usageCount).toBe(10);
      });
  });

  describe('Edge Cases and Security', () => {
    it('should reject extremely long keys', async () => {
      const longKey = 'a'.repeat(10000);
      const res = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': longKey }
      });
      // Currently it might just say Invalid API Key (401) after hitting DB
      expect(res.status).toBe(401);
    });

    it('should handle special characters in key', async () => {
      const specialKey = 'key-with-special-chars-!@#$%^&*()_+';
      const res = await app.request('/api/v1/software/verify', {
        headers: { 'X-API-Key': specialKey }
      });
      expect(res.status).toBe(401);
    });

    it('should handle multiple X-API-Key headers (if possible)', async () => {
      // Hono might join them with commas or just take one.
      const res = await app.request('/api/v1/software/verify', {
        headers: [
            ['X-API-Key', 'key1'],
            ['X-API-Key', 'key2']
        ] as any
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Load Testing', () => {
    it('should handle a high volume of requests across different keys', async () => {
        // Create 5 keys, 100 requests each = 500 requests
        const keys = [];
        for(let i=0; i<5; i++) {
            const key = `load-test-key-${i}`;
            await db.insert(apiKeys).values({
                key,
                name: `Load Key ${i}`,
                isActive: true,
            }).execute();
            keys.push(key);
        }

        const start = Date.now();
        const promises = [];
        for(let i=0; i<500; i++) {
            const key = keys[i % 5];
            promises.push(app.request('/api/v1/software/verify', {
                headers: { 'X-API-Key': key }
            }));
        }

        const responses = await Promise.all(promises);
        const duration = Date.now() - start;
        
        responses.forEach(res => {
            expect(res.status).toBe(200);
        });
        
        console.log(`Completed 500 requests in ${duration}ms`);
    });
  });
});
