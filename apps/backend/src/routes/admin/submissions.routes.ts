import { Hono } from 'hono';
import { authenticateAdmin } from '../../middleware/authenticateAdmin';
import { zValidator } from '../../middleware/validator';
import { listSubmissionsQuerySchema, type ListSubmissionsQueryInput } from '../../schemas/submission.schema';
import { SubmissionService } from '../../services/submission.service';

const adminSubmissionRoutes = new Hono()
  /**
   * GET /api/admin/submissions
   * Fetches all user submissions with pagination and advanced filtering.
   * Requires admin authentication.
   */
  .get(
    '/submissions',
    authenticateAdmin,
    zValidator('query', listSubmissionsQuerySchema),
    async (c) => {
      const validated = (c as any).get('validated') as ListSubmissionsQueryInput;
      
      try {
        const result = await SubmissionService.getAllSubmissions({
          page: validated.page,
          limit: validated.limit,
          search: validated.search,
          startDate: validated.startDate,
          endDate: validated.endDate,
          numberOfCashiers: validated.numberOfCashiers,
          minCashiers: validated.minCashiers,
          maxCashiers: validated.maxCashiers,
        });
        
        return c.json({
          success: true,
          ...result
        }, 200);
      } catch (error) {
        console.error('Error in fetch all submissions route:', error);
        return c.json({
          success: false,
          message: 'Internal server error while fetching submissions'
        }, 500);
      }
    }
  );

export default adminSubmissionRoutes;
