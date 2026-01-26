import { generateLicense, verifyLicense } from '../src/utils/licenseKeyGenerator';
import { LicenseService } from '../src/services/license.service';
import { db } from '../src/db/db';
import { licenseKeys, userSubmissions } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Helper for __dirname in ESM
const getDirname = () => {
  const currentCwd = process.cwd();
  if (currentCwd.endsWith('apps/backend') || currentCwd.endsWith('apps\\backend')) {
    return path.join(currentCwd, 'tests');
  }
  return path.join(currentCwd, 'apps', 'backend', 'tests');
};
const __dirname_val = getDirname();
const PUBLIC_KEY_PATH = path.join(__dirname_val, '..', 'src', 'utils', 'public_key.pem');

describe('License Key Integrity and Performance Tests', () => {
  const testMachineId = 'TEST-MACHINE-123';
  const testAppName = 'Test App';
  const testMaxUsers = 10;

  test('Verify license key generation produces 10,000 unique keys', () => {
    const keys = new Set<string>();
    const count = 10000;
    
    console.log(`Generating ${count} keys...`);
    const start = Date.now();
    
    for (let i = 0; i < count; i++) {
      const { serialKey } = generateLicense(testMachineId, testAppName, testMaxUsers);
      keys.add(serialKey);
    }
    
    const end = Date.now();
    console.log(`Generated ${count} keys in ${end - start}ms (${(end - start) / count}ms per key)`);
    
    expect(keys.size).toBe(count);
  });

  test('Verify all generated keys match expected format', () => {
    const { serialKey } = generateLicense(testMachineId, testAppName, testMaxUsers);
    // Format: <base64 payload>.<base64 signature>
    const parts = serialKey.split('.');
    expect(parts.length).toBe(2);
    
    const [payloadB64, signatureB64] = parts;
    expect(() => Buffer.from(payloadB64, 'base64')).not.toThrow();
    expect(() => Buffer.from(signatureB64, 'base64')).not.toThrow();
    
    // Check if payload is valid JSON
    const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    expect(payload).toHaveProperty('machineId', testMachineId);
    expect(payload).toHaveProperty('appName', testAppName);
    expect(payload).toHaveProperty('maxUsers', testMaxUsers);
    expect(payload).toHaveProperty('issueDate');
  });

  test('Test concurrent license generation', async () => {
    const count = 100;
    const promises = Array.from({ length: count }).map(() => 
      new Promise<{ serialKey: string }>((resolve) => {
        // Use a small timeout to ensure they might hit the same millisecond if not careful
        // but generateLicense is synchronous anyway. 
        // We'll just run them in "parallel" via Promise.all
        resolve(generateLicense(testMachineId, testAppName, testMaxUsers));
      })
    );
    
    const results = await Promise.all(promises);
    const keys = new Set(results.map(r => r.serialKey));
    
    // Even if generated concurrently, they should be unique if issueDate has enough precision
    // or if they are truly sequential. Node.js is single-threaded for JS, 
    // but Promise.all might show if there's any race condition in some internal state (though unlikely here).
    expect(keys.size).toBe(count);
  });

  test('Verify database unique constraint prevents duplicate keys', async () => {
    const { serialKey } = generateLicense('DB-TEST-MACHINE', 'DB-TEST-APP', 5);
    
    // Insert once
    await db.insert(licenseKeys).values({
      licenseKey: serialKey,
      machineId: 'DB-TEST-MACHINE',
      status: 'active',
    });
    
    // Try to insert again
    await expect(db.insert(licenseKeys).values({
      licenseKey: serialKey,
      machineId: 'DB-TEST-MACHINE',
      status: 'active',
    })).rejects.toThrow();
    
    // Cleanup
    await db.delete(licenseKeys).where(eq(licenseKeys.licenseKey, serialKey));
  });

  test('Test machine ID duplicate prevention in LicenseService', async () => {
    const machineId = 'DUPLICATE-MACH-ID-' + Date.now();
    const submissionData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '123456789',
      shopName: 'Test Shop',
      machineId: machineId,
      numberOfCashiers: 1,
    };

    // First creation
    await LicenseService.createLicenseWithTransaction(submissionData);

    // Second creation with same machine ID should fail
    await expect(LicenseService.createLicenseWithTransaction(submissionData))
      .rejects.toThrow('A license already exists for this machine ID');

    // Cleanup
    const license = await db.query.licenseKeys.findFirst({
      where: eq(licenseKeys.machineId, machineId)
    });
    if (license) {
      await db.delete(userSubmissions).where(eq(userSubmissions.licenseKeyId, license.id));
      await db.delete(licenseKeys).where(eq(licenseKeys.id, license.id));
    }
  });

  test('Verify license keys are cryptographically signed and validatable', () => {
    const { serialKey } = generateLicense(testMachineId, testAppName, testMaxUsers);
    const result = verifyLicense(serialKey, PUBLIC_KEY_PATH);
    expect(result.valid).toBe(true);
    expect(result.payload.machineId).toBe(testMachineId);
  });

  test('Identify invalid formats correctly', () => {
    expect(verifyLicense('invalid-format', PUBLIC_KEY_PATH).valid).toBe(false);
    expect(verifyLicense('part1.part2.part3', PUBLIC_KEY_PATH).valid).toBe(false);
    
    const { serialKey } = generateLicense(testMachineId, testAppName, testMaxUsers);
    const [payload, sig] = serialKey.split('.');
    const tamperedKey = payload + '.' + Buffer.from('tampered-signature').toString('base64');
    expect(verifyLicense(tamperedKey, PUBLIC_KEY_PATH).valid).toBe(false);
  });

  test('Benchmark generation speed', () => {
    const count = 100;
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      generateLicense(testMachineId, testAppName, testMaxUsers);
    }
    const end = performance.now();
    const avgTime = (end - start) / count;
    console.log(`Average generation time: ${avgTime}ms`);
    expect(avgTime).toBeLessThan(100);
  });

  test('Test key randomness/entropy (statistical heuristic)', () => {
    const count = 1000;
    const keys = [];
    for (let i = 0; i < count; i++) {
      keys.push(generateLicense(testMachineId, testAppName, testMaxUsers).serialKey);
    }
    
    // Check for common prefixes (other than the base64 encoded payload if they are the same)
    // Actually, the payload includes issueDate which changes every time.
    // So the payload part should be different.
    const payloads = keys.map(k => k.split('.')[0]);
    const uniquePayloads = new Set(payloads);
    expect(uniquePayloads.size).toBe(count);

    // Basic entropy check: average character distribution should be somewhat uniform
    // (though base64 limits the alphabet)
    const charCounts: Record<string, number> = {};
    let totalChars = 0;
    keys.forEach(key => {
      const sig = key.split('.')[1];
      for (const char of sig) {
        charCounts[char] = (charCounts[char] || 0) + 1;
        totalChars++;
      }
    });

    // We expect a variety of characters
    expect(Object.keys(charCounts).length).toBeGreaterThan(50); // Base64 has 64 chars + =
  });
});
