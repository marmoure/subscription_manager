import { Hono } from 'hono';
import { db } from '../db/db';
import { userSubmissions } from '../db/schema';
import { LicenseService } from '../services/license.service';
import { submitLicenseRequestSchema } from '../schemas/submission.schema';
import { rateLimiter, verifyCaptcha, zValidator } from '../middleware';

const publicRoutes = new Hono();

/**
 * POST /api/public/submit-license-request
 * Public endpoint to submit a license request
 */
publicRoutes.post(
  '/submit-license-request',
  rateLimiter,
  zValidator(submitLicenseRequestSchema),
  verifyCaptcha,
  async (c) => {
    try {
      const validatedData = c.get('validated' as any);
      const ipAddress = c.req.header('x-forwarded-for') || 'unknown';

      // 1. Store the user submission
      const [newSubmission] = await db.insert(userSubmissions).values({
        name: validatedData.name,
        machineId: validatedData.machineId,
        phone: validatedData.phone,
        shopName: validatedData.shopName,
        email: validatedData.email,
        numberOfCashiers: validatedData.numberOfCashiers,
        ipAddress: ipAddress,
      }).returning();

      if (!newSubmission) {
        throw new Error('Failed to create user submission');
      }

      // 2. Generate and store the license
      const license = await LicenseService.generateAndStoreLicense(newSubmission);

      // 3. Return 201 Created with the license key
      return c.json({
        success: true,
        message: 'License request submitted successfully',
        data: {
          licenseKey: license.licenseKey,
          expiresAt: license.expiresAt,
        }
      }, 201);

    } catch (error) {
      console.error('Error processing license request:', error);
      
      if (error instanceof Error) {
        return c.json({
          success: false,
          message: error.message
        }, 500);
      }

      return c.json({
        success: false,
        message: 'An unexpected error occurred while processing your request'
      }, 500);
    }
  }
);

export default publicRoutes;
