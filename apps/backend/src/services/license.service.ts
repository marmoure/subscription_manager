import { db } from '../db/db';
import { licenseKeys, userSubmissions, verificationLogs, licenseStatusLogs, adminUsers, type LicenseKey, type UserSubmission, type NewUserSubmission, type VerificationLog, type LicenseStatusLog } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { generateLicense } from '../utils/licenseKeyGenerator';

export class LicenseService {
  /**
   * Gets a single license by its ID with full submission data and verification metadata.
   * @param id The license record ID
   * @returns The complete license object or null if not found
   */
  static async getLicenseById(id: number) {
    try {
      const license = await db.query.licenseKeys.findFirst({
        where: eq(licenseKeys.id, id),
        with: {
          submission: true,
          verificationLogs: {
            orderBy: [desc(verificationLogs.timestamp)],
            limit: 50, // Get last 50 logs for history
          },
        },
      });

      if (!license) {
        return null;
      }

      // Calculate metadata
      const verificationAttempts = license.verificationLogs.length;
      const lastVerification = license.verificationLogs[0]?.timestamp || null;

      return {
        ...license,
        metadata: {
          verificationAttempts,
          lastVerification,
        },
      };
    } catch (error) {
      console.error(`Error in getLicenseById: ${error}`);
      throw new Error('Database query failed while fetching license by ID');
    }
  }

  /**
   * Gets all licenses with pagination and optional filtering.
   * @param options Pagination and filtering options
   * @returns List of licenses and pagination metadata
   */
  static async getAllLicenses(options: {
    page: number;
    limit: number;
    status?: 'active' | 'inactive' | 'revoked';
  }) {
    const { page, limit, status } = options;
    const offset = (page - 1) * limit;

    try {
      const whereClause = status ? eq(licenseKeys.status, status) : undefined;

      // Count total matches for pagination
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(licenseKeys)
        .where(whereClause);

      const total = totalResult?.count || 0;
      const totalPages = Math.ceil(total / limit);

      // Fetch paginated results with joined submission data using select
      const data = await db
        .select({
          id: licenseKeys.id,
          licenseKey: licenseKeys.licenseKey,
          machineId: licenseKeys.machineId,
          status: licenseKeys.status,
          createdAt: licenseKeys.createdAt,
          updatedAt: licenseKeys.updatedAt,
          expiresAt: licenseKeys.expiresAt,
          submission: {
            id: userSubmissions.id,
            name: userSubmissions.name,
            email: userSubmissions.email,
            phone: userSubmissions.phone,
            shopName: userSubmissions.shopName,
            numberOfCashiers: userSubmissions.numberOfCashiers,
            submissionDate: userSubmissions.submissionDate,
          }
        })
        .from(licenseKeys)
        .leftJoin(userSubmissions, eq(licenseKeys.id, userSubmissions.licenseKeyId))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(licenseKeys.createdAt));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error(`Error in getAllLicenses: ${error}`);
      throw new Error('Database query failed while fetching all licenses');
    }
  }

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
      return db.transaction((tx) => {
        // 1. Insert the new license key into licenseKeys table
        const [insertedLicense] = tx.insert(licenseKeys).values({
          licenseKey: serialKey,
          machineId: userData.machineId,
          status: 'active',
          expiresAt: expiresDate ? new Date(expiresDate) : null,
        }).returning().all();

        if (!insertedLicense) {
          throw new Error('Failed to insert the license key into the database.');
        }

        // 2. Link the license to the user submission via foreign key
        tx.update(userSubmissions)
          .set({ licenseKeyId: insertedLicense.id })
          .where(eq(userSubmissions.id, userData.id))
          .run();

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
   * Creates a user submission and generates a license in a single transaction.
   * Checks for duplicate machine ID before proceeding.
   * @param data Validated submission data
   * @returns The generated license key
   */
  static async createLicenseWithTransaction(data: NewUserSubmission): Promise<LicenseKey> {
    // 1. Check for duplicate machine ID
    const existingLicense = await this.checkMachineIdExists(data.machineId);
    if (existingLicense) {
      const error = new Error('A license already exists for this machine ID');
      (error as any).code = 'DUPLICATE_MACHINE_ID';
      throw error;
    }

    try {
      // Use synchronous transaction for better-sqlite3 consistency
      return db.transaction((tx) => {
        // 2. Store the user submission
        const [newSubmission] = tx.insert(userSubmissions).values(data).returning().all();

        if (!newSubmission) {
          throw new Error('Failed to create user submission');
        }

        // 3. Generate the license
        let serialKey: string = '';
        let expiresDate: string | null = null;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!isUnique && attempts < maxAttempts) {
          attempts++;
          const licenseResult = generateLicense(
            newSubmission.machineId,
            newSubmission.shopName,
            newSubmission.numberOfCashiers
          );

          serialKey = licenseResult.serialKey;
          expiresDate = licenseResult.expiresDate;

          const existing = tx.query.licenseKeys.findFirst({
            where: eq(licenseKeys.licenseKey, serialKey),
          });

          if (!existing) {
            isUnique = true;
          }
        }

        if (!isUnique) {
          throw new Error('Could not generate a unique license key after multiple attempts.');
        }

        // 4. Insert the new license key
        const [insertedLicense] = tx.insert(licenseKeys).values({
          licenseKey: serialKey,
          machineId: newSubmission.machineId,
          status: 'active',
          expiresAt: expiresDate ? new Date(expiresDate) : null,
        }).returning().all();

        if (!insertedLicense) {
          throw new Error('Failed to insert the license key into the database.');
        }

        // 5. Link the license to the user submission
        tx.update(userSubmissions)
          .set({ licenseKeyId: insertedLicense.id })
          .where(eq(userSubmissions.id, newSubmission.id))
          .run();

        return insertedLicense;
      });
    } catch (error) {
      console.error(`Error in createLicenseWithTransaction: ${error}`);
      throw error;
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

  /**
   * Verifies a license by machine ID.
   * @param machineId The machine ID to verify
   * @param ipAddress Optional IP address for logging
   * @returns The verification result
   */
  static async verifyLicense(machineId: string, ipAddress?: string) {
    try {
      const license = await db.query.licenseKeys.findFirst({
        where: eq(licenseKeys.machineId, machineId),
        with: {
          submission: true,
        },
      });

      if (!license) {
        return {
          valid: false,
          message: 'No license found for this machine ID',
        };
      }

      let valid = true;
      let message = 'License is valid';

      if (license.status !== 'active') {
        valid = false;
        message = `License is ${license.status}`;
      } else if (license.expiresAt && license.expiresAt < new Date()) {
        valid = false;
        message = 'License has expired';
      }

      // Log the verification attempt
      try {
        await db.insert(verificationLogs).values({
          licenseKeyId: license.id,
          machineId: machineId,
          status: valid ? 'success' : 'failed',
          message: message,
          ipAddress: ipAddress,
          timestamp: new Date(),
        }).run();
      } catch (logError) {
        console.error('Failed to log verification attempt:', logError);
        // Don't fail the verification just because logging failed
      }

      if (!valid) {
        return {
          valid: false,
          message: message,
        };
      }

      return {
        valid: true,
        license: {
          key: license.licenseKey,
          status: license.status,
          shopName: license.submission?.shopName || 'Unknown',
          customerName: license.submission?.name || 'Unknown',
        },
        expiresAt: license.expiresAt,
      };
    } catch (error) {
      console.error(`Error verifying license: ${error}`);
      throw new Error('Verification failed due to a database error');
    }
  }

  /**
   * Updates the status of a license and logs the change.
   * @param id License ID
   * @param status New status
   * @param adminId Admin user ID performing the action
   * @param reason Optional reason for the status change
   * @returns The updated license or null if not found
   */
  static async updateLicenseStatus(
    id: number,
    status: 'active' | 'inactive' | 'revoked',
    adminId: number,
    reason?: string
  ): Promise<LicenseKey | null> {
    try {
      // Find the license first to get the current status
      const license = await db.query.licenseKeys.findFirst({
        where: eq(licenseKeys.id, id),
      });

      if (!license) {
        return null;
      }

      // If status is the same, just return the license
      if (license.status === status) {
        return license;
      }

      const oldStatus = license.status;

      // Update in a transaction
      return db.transaction((tx) => {
        // 1. Update the license status
        const [updatedLicense] = tx.update(licenseKeys)
          .set({ 
            status,
            updatedAt: new Date()
          })
          .where(eq(licenseKeys.id, id))
          .returning()
          .all();

        if (!updatedLicense) {
          throw new Error('Failed to update license status');
        }

        // 2. Log the status change
        tx.insert(licenseStatusLogs).values({
          licenseKeyId: id,
          oldStatus: oldStatus as 'active' | 'inactive' | 'revoked',
          newStatus: status,
          adminId,
          reason: reason || null,
          timestamp: new Date(),
        }).run();

        return updatedLicense;
      });
    } catch (error) {
      console.error(`Error in updateLicenseStatus: ${error}`);
      throw new Error('Database update failed while updating license status');
    }
  }
}
