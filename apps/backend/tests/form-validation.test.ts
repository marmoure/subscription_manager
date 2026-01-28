import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

process.env.NODE_ENV = 'test';

import { app } from '../src/index';
import { client } from '../src/db/db';
import { resetRateLimit } from '../src/middleware/rateLimiter';

describe('Form Validation Edge Cases and Malicious Inputs', () => {
  const RUN_ID = Date.now().toString(36);

  beforeEach(() => {
    resetRateLimit();
  });


  const validBasePayload = {
    name: 'John Doe',
    machineId: `MACHINE${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, ''),
    phone: '1234567890',
    shopName: 'Valid Shop',
    numberOfCashiers: 5,
    captchaToken: 'test-token'
  };

  const testValidationFailure = async (payload: any, expectedField?: string) => {
    const res = await app.request('/api/public/submit-license-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json() as any;
    if (res.status !== 400) {
      console.log('Expected 400 but got', res.status, data);
    }
    expect(res.status).toBe(400);
    expect(data.message).toBe('Validation failed');
    if (expectedField) {
      expect(data.errors.fieldErrors[expectedField]).toBeDefined();
    }
  };

  describe('Name Validation', () => {
    it('should reject name too short', async () => {
      await testValidationFailure({ ...validBasePayload, name: 'A' }, 'name');
    });

    it('should reject name too long', async () => {
      // Current backend schema doesn't have max, but frontend does (100)
      // We should probably add it to backend too.
      await testValidationFailure({ ...validBasePayload, name: 'A'.repeat(101) }, 'name');
    });

    it('should handle SQL injection attempts in name', async () => {
      // Drizzle handles parameterization, so we allow characters like '
      const payload = { ...validBasePayload, name: "O'Connor; --", machineId: `SQLI1${RUN_ID}`.replace(/[^a-zA-Z0-9]/g, '') };
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status !== 201) {
        console.log('SQLi test failed:', await res.json());
      }
      expect(res.status).toBe(201);
    });

    it('should reject XSS attempts in name', async () => {
      // We block < and >
      await testValidationFailure({ ...validBasePayload, name: '<script>alert("xss")</script>' }, 'name');
    });
  });

  describe('Machine ID Validation', () => {
    it('should reject empty machine ID', async () => {
      await testValidationFailure({ ...validBasePayload, machineId: '' }, 'machineId');
    });

    it('should reject non-alphanumeric machine ID', async () => {
      await testValidationFailure({ ...validBasePayload, machineId: 'MACHINE-ID-123!' }, 'machineId');
    });
  });

  describe('Phone Validation', () => {
    it('should reject invalid phone formats', async () => {
      await testValidationFailure({ ...validBasePayload, phone: 'not-a-phone' }, 'phone');
      await testValidationFailure({ ...validBasePayload, phone: '123' }, 'phone'); // Too short now
      await testValidationFailure({ ...validBasePayload, phone: 'A'.repeat(20) }, 'phone');
    });

    it('should accept valid international format', async () => {
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBasePayload, phone: '+12345678901', machineId: `PHONEINT${RUN_ID}2`.replace(/[^a-zA-Z0-9]/g, '') })
      });
      if (res.status !== 201) {
        console.log('Phone int test failed:', await res.json());
      }
      expect(res.status).toBe(201);
    });

    it('should accept valid Algerian phone formats', async () => {
      const algerianNumbers = ['0661123456', '0550123456', '0770123456', '021123456', '+213550123456', '00213550123456'];
      for (const phone of algerianNumbers) {
        resetRateLimit(); // Reset for each attempt in the loop
        const res = await app.request('/api/public/submit-license-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validBasePayload, phone, machineId: `PHONEDZ${RUN_ID}${phone.replace(/[^0-9]/g, '')}`.replace(/[^a-zA-Z0-9]/g, '') })
        });
        if (res.status !== 201) {
          console.log(`Algerian phone test failed for ${phone}:`, await res.json());
        }
        expect(res.status).toBe(201);
      }
    });
  });



  describe('Cashiers Validation', () => {
    it('should reject invalid number of cashiers', async () => {
      await testValidationFailure({ ...validBasePayload, numberOfCashiers: 0 }, 'numberOfCashiers');
      await testValidationFailure({ ...validBasePayload, numberOfCashiers: -1 }, 'numberOfCashiers');
      await testValidationFailure({ ...validBasePayload, numberOfCashiers: 5.5 }, 'numberOfCashiers');
      await testValidationFailure({ ...validBasePayload, numberOfCashiers: 100 }, 'numberOfCashiers'); // Backend doesn't have max 50 yet
    });

    it('should reject extremely large number of cashiers', async () => {
      await testValidationFailure({ ...validBasePayload, numberOfCashiers: 1000000000 }, 'numberOfCashiers');
    });
  });

  describe('Unicode and Emojis', () => {
    it('should accept unicode characters and emojis', async () => {
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validBasePayload,
          name: '🚀 User ✨',
          shopName: '🏪 Unicode Shop 🌍',
          machineId: `UNICODE${RUN_ID}2`.replace(/[^a-zA-Z0-9]/g, '')
        })
      });
      if (res.status !== 201) {
        console.log('Unicode test failed:', await res.json());
      }
      expect(res.status).toBe(201);
    });
  });

  describe('Multiple Invalid Fields', () => {
    it('should return multiple errors when multiple fields are invalid', async () => {
      const res = await app.request('/api/public/submit-license-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'A',
          machineId: '',
          phone: 'abc',
          numberOfCashiers: -5,
          captchaToken: ''
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.errors.fieldErrors.name).toBeDefined();
      expect(data.errors.fieldErrors.machineId).toBeDefined();
      expect(data.errors.fieldErrors.phone).toBeDefined();
      expect(data.errors.fieldErrors.numberOfCashiers).toBeDefined();
      expect(data.errors.fieldErrors.captchaToken).toBeDefined();
    });
  });
});
