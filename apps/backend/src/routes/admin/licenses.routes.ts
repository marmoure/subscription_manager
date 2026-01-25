import { Hono } from 'hono';
import { authenticateAdmin } from '../../middleware/authenticateAdmin';
import { zValidator } from '../../middleware/validator';
import { listLicensesQuerySchema, type ListLicensesQueryInput } from '../../schemas/license.schema';
import { LicenseService } from '../../services/license.service';

const adminLicenseRoutes = new Hono()
  /**
   * GET /api/admin/licenses
   * Fetches all license keys with pagination and optional filtering by status.
   * Requires admin authentication.
   */
  .get(
    '/licenses',
    authenticateAdmin,
    zValidator('query', listLicensesQuerySchema),
    async (c) => {
      const { page, limit, status } = (c as any).get('validated') as ListLicensesQueryInput;
      
      try {
        const result = await LicenseService.getAllLicenses({
          page,
          limit,
          status: status as 'active' | 'inactive' | 'revoked' | undefined,
        });
        
        return c.json({
          success: true,
          ...result
        }, 200);
      } catch (error) {
        console.error('Error in fetch all licenses route:', error);
        return c.json({
          success: false,
          message: 'Internal server error while fetching licenses'
        }, 500);
      }
    }
  );

export default adminLicenseRoutes;
