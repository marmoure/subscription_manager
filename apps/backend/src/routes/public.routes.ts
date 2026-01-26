import { Hono } from 'hono';
import { LicenseService } from '../services/license.service';
import { submitLicenseRequestSchema, type SubmitLicenseRequestInput } from '../schemas/submission.schema';
import { rateLimiter, verifyCaptcha, zValidator } from '../middleware';

const publicRoutes = new Hono()
  /**
   * POST /api/public/submit-license-request
   * Public endpoint to submit a license request
   */
  .post(
    '/submit-license-request',
    rateLimiter,
    zValidator('json', submitLicenseRequestSchema),
    verifyCaptcha,
    async (c) => {
      try {
        const validatedData = (c as any).get('validated') as SubmitLicenseRequestInput;
        const ipAddress = c.req.header('x-forwarded-for') || 'unknown';

        // Honeypot check: if website field is filled, it's likely a bot
        if (validatedData.website) {
          console.warn(`Spam detected from IP: ${ipAddress}. Honeypot field filled.`);
          return c.json({
            success: false,
            message: 'Spam detected'
          }, 400);
        }

        // Use a single transaction to create submission and license
        const license = await LicenseService.createLicenseWithTransaction({
          name: validatedData.name,
          machineId: validatedData.machineId,
          phone: validatedData.phone,
          shopName: validatedData.shopName,
          email: validatedData.email,
          numberOfCashiers: validatedData.numberOfCashiers,
          ipAddress: ipAddress,
        });

        // 3. Return 201 Created with the license key
        return c.json({
          success: true,
          message: 'License request submitted successfully',
          data: {
            licenseKey: license.licenseKey,
            expiresAt: license.expiresAt,
          }
        }, 201);

      } catch (error: any) {
        console.error('Error processing license request:', error);
        
        if (error.code === 'DUPLICATE_MACHINE_ID') {
          return c.json({
            success: false,
            message: 'A license already exists for this machine ID'
          }, 409);
        }

        return c.json({
          success: false,
          message: 'An unexpected error occurred while processing your request'
        }, 500);
      }
    }
  );

export default publicRoutes;
