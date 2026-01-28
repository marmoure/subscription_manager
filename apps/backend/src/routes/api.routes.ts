import { Hono } from 'hono';
import { validateApiKey, zValidator } from '../middleware';
import { verifyLicenseSchema, type VerifyLicenseInput } from '../schemas/license.schema';
import { LicenseService } from '../services/license.service';

const apiRoutes = new Hono();

// Apply API key validation to all routes in this router
apiRoutes.use('*', validateApiKey);

/**
 * POST /api/v1/verify-license
 * RPC route to verify a license by machine ID
 */
apiRoutes.post(
  '/verify-license',
  zValidator('json', verifyLicenseSchema),
  async (c) => {
    const { machineId } = (c as any).get('validatedJson') as VerifyLicenseInput;
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('remote-addr');

    try {
      const result = await LicenseService.verifyLicense(machineId, ipAddress);

      if (!result.valid) {
        return c.json(result, 404);
      }

      return c.json(result, 200);
    } catch (error) {
      console.error('Error in verifyLicense route:', error);
      return c.json({
        valid: false,
        message: 'Internal server error during license verification'
      }, 500);
    }
  }
);

/**
 * GET /api/v1/software/verify
 * Simple check to verify API key is working
 */
apiRoutes.get('/software/verify', (c) => {
  return c.json({
    success: true,
    message: 'API Key is valid',
    timestamp: new Date().toISOString()
  });
});

export default apiRoutes;

export type ApiRoutes = typeof apiRoutes;
