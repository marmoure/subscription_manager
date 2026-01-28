import { jest, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Set environment variables BEFORE importing the app
process.env.DATABASE_URL = ':memory:';
process.env.NODE_ENV = 'test';

import { db, client } from '../src/db/db';
import { licenseKeys, userSubmissions } from '../src/db/schema';
import { LicenseService } from '../src/services/license.service';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as licenseGenerator from '../src/utils/licenseKeyGenerator';
import { eq } from 'drizzle-orm';

describe('License Transaction Verification', () => {
  beforeAll(() => {
    migrate(db, { migrationsFolder: 'drizzle' });
  });

  afterAll(() => {
    client.close();
  });

  beforeEach(async () => {
    await db.delete(userSubmissions).execute();
    await db.delete(licenseKeys).execute();

    // Default mock: Success with unique key
    jest.spyOn(licenseGenerator, 'generateLicense').mockImplementation(() => ({
      serialKey: `KEY-${Math.random().toString(36).substring(7)}`,
      expiresDate: null,
      issueDate: new Date().toISOString(),
      payload: {}
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validSubmission = {
    name: 'Test User',
    machineId: 'MACHINE-123',
    phone: '1234567890',
    shopName: 'Test Shop',
    numberOfCashiers: 1,
  };

  describe('Atomicity and Rollback', () => {
    it('should rollback user submission if license generation fails (exhausts retries)', async () => {
      // 1. Seed a license key
      const existingKey = 'AAAA-BBBB-CCCC-DDDD';
      await db.insert(licenseKeys).values({
        licenseKey: existingKey,
        machineId: 'OTHER-MACHINE',
        status: 'active'
      });

      // 2. Mock generator to always return the existing key
      jest.spyOn(licenseGenerator, 'generateLicense').mockReturnValue({
        serialKey: existingKey,
        expiresDate: null,
        issueDate: new Date().toISOString(),
        payload: {}
      });

      // 3. Attempt to create license
      await expect(LicenseService.createLicenseWithTransaction(validSubmission))
        .rejects
        .toThrow('Could not generate a unique license key');

      // 4. Verify userSubmissions is empty (rolled back)
      const submissions = await db.select().from(userSubmissions);
      expect(submissions).toHaveLength(0);
    });


  });

  describe('Concurrency and Race Conditions', () => {
    it('should prevent duplicate licenses even if checkMachineIdExists is bypassed (Race Condition Protected)', async () => {
      // 1. Create an initial license
      await LicenseService.createLicenseWithTransaction(validSubmission);

      const licensesBefore = await db.select().from(licenseKeys);
      expect(licensesBefore).toHaveLength(1);

      // 2. Simulate Race Condition:
      // Request 2 checks for existence, finds nothing (mocked), proceeds to transaction.
      jest.spyOn(LicenseService, 'checkMachineIdExists').mockResolvedValue(null);

      // 3. Attempt to create another license for SAME machine
      // This should now FAIL due to the database unique constraint on machineId
      await expect(LicenseService.createLicenseWithTransaction(validSubmission))
        .rejects
        .toThrow();

      // 4. Verify we still have only 1 license
      const licensesAfter = await db.select().from(licenseKeys);
      expect(licensesAfter).toHaveLength(1);
    });
  });
});
