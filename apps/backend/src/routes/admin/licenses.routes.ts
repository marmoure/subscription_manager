import { Hono } from 'hono';
import { authenticateAdmin, authorizeRole, type AdminVariables } from '../../middleware/authenticateAdmin';
import { zValidator } from '../../middleware/validator';
import {
  listLicensesQuerySchema,
  getLicenseByIdSchema,
  updateLicenseStatusSchema,
  revokeLicenseSchema,
  type ListLicensesQueryInput,
  type GetLicenseByIdInput,
  type UpdateLicenseStatusInput,
  type RevokeLicenseInput
} from '../../schemas/license.schema';
import { LicenseService } from '../../services/license.service';

const adminLicenseRoutes = new Hono<{ Variables: AdminVariables }>()
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
      const { page, limit, status, search } = (c as any).get('validatedQuery') as ListLicensesQueryInput;

      try {
        const result = await LicenseService.getAllLicenses({
          page,
          limit,
          status: status as 'active' | 'inactive' | 'revoked' | undefined,
          search,
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
  )
  /**
   * GET /api/admin/licenses/:id
   * Fetches complete details for a single license.
   * Requires admin authentication.
   */
  .get(
    '/licenses/:id',
    authenticateAdmin,
    zValidator('param', getLicenseByIdSchema),
    async (c) => {
      const { id } = (c as any).get('validatedParam') as GetLicenseByIdInput;

      try {
        const license = await LicenseService.getLicenseById(id);

        if (!license) {
          return c.json({
            success: false,
            message: 'License not found'
          }, 404);
        }

        return c.json({
          success: true,
          data: license
        }, 200);
      } catch (error) {
        console.error(`Error in fetch license by ID route: ${error}`);
        return c.json({
          success: false,
          message: 'Internal server error while fetching license details'
        }, 500);
      }
    }
  )
  /**
   * PATCH /api/admin/licenses/:id/status
   * Updates the status of a license (active, inactive, revoked).
   * Logs the action for audit trail.
   * Requires admin authentication.
   */
  .patch(
    '/licenses/:id/status',
    authenticateAdmin,
    zValidator('param', getLicenseByIdSchema),
    zValidator('json', updateLicenseStatusSchema),
    async (c) => {
      const { id } = (c as any).get('validatedParam') as GetLicenseByIdInput;
      const { status, reason } = (c as any).get('validatedJson') as UpdateLicenseStatusInput;
      const admin = c.get('admin');

      try {
        const updatedLicense = await LicenseService.updateLicenseStatus(
          id,
          status,
          admin.id,
          reason
        );

        if (!updatedLicense) {
          return c.json({
            success: false,
            message: 'License not found'
          }, 404);
        }

        return c.json({
          success: true,
          message: `License status updated to ${status}`,
          data: updatedLicense
        }, 200);
      } catch (error) {
        console.error(`Error in update license status route: ${error}`);
        return c.json({
          success: false,
          message: 'Internal server error while updating license status'
        }, 500);
      }
    }
  )
  /**
   * DELETE /api/admin/licenses/:id
   * Revokes a license key permanently.
   * Requires admin or super-admin role.
   */
  .delete(
    '/licenses/:id',
    authenticateAdmin,
    authorizeRole(['admin', 'super-admin']),
    zValidator('param', getLicenseByIdSchema),
    zValidator('json', revokeLicenseSchema),
    async (c) => {
      const { id } = (c as any).get('validatedParam') as GetLicenseByIdInput;
      const { reason } = (c as any).get('validatedJson') as RevokeLicenseInput;
      const admin = c.get('admin');

      try {
        const revokedLicense = await LicenseService.revokeLicense(
          id,
          admin.id,
          reason
        );

        if (!revokedLicense) {
          return c.json({
            success: false,
            message: 'License not found'
          }, 404);
        }

        return c.json({
          success: true,
          message: 'License has been permanently revoked',
          data: revokedLicense
        }, 200);
      } catch (error: any) {
        if (error.status === 400) {
          return c.json({
            success: false,
            message: error.message
          }, 400);
        }

        console.error(`Error in revoke license route: ${error}`);
        return c.json({
          success: false,
          message: 'Internal server error while revoking license'
        }, 500);
      }
    }
  );

export default adminLicenseRoutes;
