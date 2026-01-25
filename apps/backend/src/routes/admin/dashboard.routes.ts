import { Hono } from 'hono';
import { authenticateAdmin } from '../../middleware/authenticateAdmin';
import { DashboardService } from '../../services/dashboard.service';

const dashboardRoutes = new Hono()
  .use('*', authenticateAdmin)
  .get('/dashboard/stats', async (c) => {
    try {
      const stats = await DashboardService.getStats();
      const charts = await DashboardService.getCharts();
      const activity = await DashboardService.getRecentActivity();

      return c.json({
        success: true,
        data: {
          stats,
          charts,
          activity
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return c.json({ success: false, message: 'Internal Server Error' }, 500);
    }
  });

export default dashboardRoutes;
