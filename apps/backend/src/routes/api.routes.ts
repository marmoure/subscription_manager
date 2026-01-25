import { Hono } from 'hono';
import { validateApiKey, zValidator } from '../middleware';
import { verifyLicenseSchema, type VerifyLicenseInput } from '../schemas/license.schema';
import { LicenseService } from '../services/license.service';

const apiRoutes = new Hono()
  /**
   * POST /api/v1/verify-license
   * RPC route to verify a license by machine ID
   */
  .post(
    '/verify-license',
    validateApiKey,
    zValidator(verifyLicenseSchema),
    async (c) => {
      const { machineId } = (c as any).get('validated') as VerifyLicenseInput;
      
      try {
        const result = await LicenseService.verifyLicense(machineId);
        
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

export default apiRoutes;
export type ApiRoutes = typeof apiRoutes;
