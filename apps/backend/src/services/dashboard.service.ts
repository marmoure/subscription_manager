import { db } from '../db/db';
import { licenseKeys, userSubmissions, licenseStatusLogs, adminUsers } from '../db/schema';
import { sql, desc, and, gte, lt, eq } from 'drizzle-orm';

export class DashboardService {
  static async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalLicensesRes] = await db.select({ count: sql<number>`count(*)` }).from(licenseKeys);

    const [activeLicensesRes] = await db.select({ count: sql<number>`count(*)` }).from(licenseKeys).where(eq(licenseKeys.status, 'active'));

    const [submissionsThisMonthRes] = await db.select({ count: sql<number>`count(*)` })
      .from(userSubmissions)
      .where(gte(userSubmissions.submissionDate, startOfMonth));

    const [submissionsLastMonthRes] = await db.select({ count: sql<number>`count(*)` })
      .from(userSubmissions)
      .where(and(gte(userSubmissions.submissionDate, startOfLastMonth), lt(userSubmissions.submissionDate, startOfMonth)));

    const currentCount = submissionsThisMonthRes?.count || 0;
    const lastMonthCount = submissionsLastMonthRes?.count || 0;

    let growth = 0;
    if (lastMonthCount === 0) {
      growth = currentCount > 0 ? 100 : 0;
    } else {
      growth = ((currentCount - lastMonthCount) / lastMonthCount) * 100;
    }

    return {
      totalLicenses: totalLicensesRes?.count || 0,
      activeLicenses: activeLicensesRes?.count || 0,
      submissionsThisMonth: currentCount,
      growth: Math.round(growth * 10) / 10,
    };
  }

  static async getCharts(days: number = 30) {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);

    // Line chart: Licenses over time
    const licensesOverTime = await db.select({
      date: sql<string>`date(${licenseKeys.createdAt} / 1000, 'unixepoch')`,
      count: sql<number>`count(*)`,
    })
      .from(licenseKeys)
      .where(gte(licenseKeys.createdAt, startDate))
      .groupBy(sql`date(${licenseKeys.createdAt} / 1000, 'unixepoch')`)
      .orderBy(sql`date(${licenseKeys.createdAt} / 1000, 'unixepoch')`);

    // Pie chart: License status distribution
    const licenseStatus = await db.select({
      status: licenseKeys.status,
      count: sql<number>`count(*)`,
    })
      .from(licenseKeys)
      .groupBy(licenseKeys.status);

    // Bar chart: Submissions by day
    const submissionsByDay = await db.select({
      date: sql<string>`date(${userSubmissions.submissionDate} / 1000, 'unixepoch')`,
      count: sql<number>`count(*)`,
    })
      .from(userSubmissions)
      .where(gte(userSubmissions.submissionDate, startDate))
      .groupBy(sql`date(${userSubmissions.submissionDate} / 1000, 'unixepoch')`)
      .orderBy(sql`date(${userSubmissions.submissionDate} / 1000, 'unixepoch')`);

    return {
      licensesOverTime,
      licenseStatus,
      submissionsByDay,
    };
  }

  static async getRecentActivity(limit: number = 10) {
    const recentSubmissions = await db.select({
      id: userSubmissions.id,
      name: userSubmissions.name,
      submissionDate: userSubmissions.submissionDate,
      shopName: userSubmissions.shopName,
    })
      .from(userSubmissions)
      .orderBy(desc(userSubmissions.submissionDate))
      .limit(limit);

    const recentStatusChanges = await db.select({
      id: licenseStatusLogs.id,
      oldStatus: licenseStatusLogs.oldStatus,
      newStatus: licenseStatusLogs.newStatus,
      timestamp: licenseStatusLogs.timestamp,
      adminUsername: adminUsers.username,
      licenseKey: licenseKeys.licenseKey,
    })
      .from(licenseStatusLogs)
      .leftJoin(adminUsers, eq(licenseStatusLogs.adminId, adminUsers.id))
      .leftJoin(licenseKeys, eq(licenseStatusLogs.licenseKeyId, licenseKeys.id))
      .orderBy(desc(licenseStatusLogs.timestamp))
      .limit(limit);

    return {
      recentSubmissions,
      recentStatusChanges,
    };
  }
}
