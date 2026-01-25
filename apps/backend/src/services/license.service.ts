import { db } from '../db/db';
import { licenseKeys, userSubmissions, type LicenseKey, type UserSubmission } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateLicense } from '../utils/licenseKeyGenerator';

export class LicenseService {
  /**
   * Generates a license key and stores it in the database.
   * Links it to the user submission.
   * @param userData The user submission data
   * @returns The created license key record
   */
  static async generateAndStoreLicense(userData: UserSubmission): Promise<LicenseKey> {
    try {
      let serialKey: string = '';
      let expiresDate: string | null = null;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 5;

      // Handle collision by regenerating if necessary
      while (!isUnique && attempts < maxAttempts) {
        attempts++;
        const licenseResult = generateLicense(
          userData.machineId,
          userData.shopName,
          userData.numberOfCashiers
        );
        
        serialKey = licenseResult.serialKey;
        expiresDate = licenseResult.expiresDate;

        const existing = await db.query.licenseKeys.findFirst({
          where: eq(licenseKeys.licenseKey, serialKey),
        });

        if (!existing) {
          isUnique = true;
        }
      }

      if (!isUnique) {
        throw new Error('Could not generate a unique license key after multiple attempts due to collisions.');
      }

      // Use a transaction to ensure both records are updated correctly
      return await db.transaction(async (tx) => {
        // 1. Insert the new license key into licenseKeys table
        const [insertedLicense] = await tx.insert(licenseKeys).values({
          licenseKey: serialKey,
          machineId: userData.machineId,
          status: 'active',
          expiresAt: expiresDate ? new Date(expiresDate) : null,
        }).returning();

        if (!insertedLicense) {
          throw new Error('Failed to insert the license key into the database.');
        }

        // 2. Link the license to the user submission via foreign key
        await tx.update(userSubmissions)
          .set({ licenseKeyId: insertedLicense.id })
          .where(eq(userSubmissions.id, userData.id));

        return insertedLicense;
      });
    } catch (error) {
      console.error(`Error in generateAndStoreLicense: ${error}`);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during license generation and storage.');
    }
  }

  /**
   * Checks if a license already exists for the given machine ID.
   * Prioritizes 'active' licenses if multiple exist.
   * @param machineId The machine ID to check
   * @returns The existing license if found, null otherwise
   */
  static async checkMachineIdExists(machineId: string): Promise<LicenseKey | null> {
    try {
      // First, try to find an active license
      const activeLicense = await db.query.licenseKeys.findFirst({
        where: and(
          eq(licenseKeys.machineId, machineId),
          eq(licenseKeys.status, 'active')
        ),
        orderBy: [desc(licenseKeys.createdAt)],
      });

      if (activeLicense) {
        return activeLicense;
      }

      // If no active license, find the most recent one (regardless of status)
      const latestLicense = await db.query.licenseKeys.findFirst({
        where: eq(licenseKeys.machineId, machineId),
        orderBy: [desc(licenseKeys.createdAt)],
      });

      return latestLicense || null;
    } catch (error) {
      console.error(`Error checking machine ID exists: ${error}`);
      throw new Error('Database query failed while checking machine ID');
    }
  }

  /**
   * Gets all licenses for a machine ID with pagination.
   * @param machineId The machine ID to search for
   * @param limit Number of records to return
   * @param offset Number of records to skip
   * @returns List of licenses
   */
  static async getLicensesByMachineId(
    machineId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<LicenseKey[]> {
    try {
      return await db.query.licenseKeys.findMany({
        where: eq(licenseKeys.machineId, machineId),
        limit,
        offset,
        orderBy: [desc(licenseKeys.createdAt)],
      });
    } catch (error) {
      console.error(`Error fetching licenses for machine ID: ${error}`);
      throw new Error('Database query failed while fetching licenses for machine ID');
    }
  }
}
