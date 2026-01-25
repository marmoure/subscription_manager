import { db } from '../db/db';
import { userSubmissions, licenseKeys } from '../db/schema';
import { eq, desc, and, sql, or, like, gte, lte } from 'drizzle-orm';

export class SubmissionService {
  /**
   * Gets all user submissions with pagination and advanced filtering.
   * @param options Filtering and pagination options
   * @returns Paginated list of submissions with license info
   */
  static async getAllSubmissions(options: {
    page: number;
    limit: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    numberOfCashiers?: number;
    minCashiers?: number;
    maxCashiers?: number;
  }) {
    const { 
      page, 
      limit, 
      search, 
      startDate, 
      endDate, 
      numberOfCashiers, 
      minCashiers, 
      maxCashiers 
    } = options;
    const offset = (page - 1) * limit;

    try {
      const filters = [];

      // Search in name, email, and shopName
      if (search) {
        const searchPattern = `%${search}%`;
        filters.push(or(
          like(userSubmissions.name, searchPattern),
          like(userSubmissions.email, searchPattern),
          like(userSubmissions.shopName, searchPattern)
        ));
      }

      // Filter by submission date range
      if (startDate) {
        filters.push(gte(userSubmissions.submissionDate, new Date(startDate)));
      }

      if (endDate) {
        filters.push(lte(userSubmissions.submissionDate, new Date(endDate)));
      }

      // Filter by number of cashiers (exact or range)
      if (numberOfCashiers !== undefined) {
        filters.push(eq(userSubmissions.numberOfCashiers, numberOfCashiers));
      } else {
        if (minCashiers !== undefined) {
          filters.push(gte(userSubmissions.numberOfCashiers, minCashiers));
        }
        if (maxCashiers !== undefined) {
          filters.push(lte(userSubmissions.numberOfCashiers, maxCashiers));
        }
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      // Count total matches for pagination
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userSubmissions)
        .where(whereClause);

      const total = totalResult?.count || 0;
      const totalPages = Math.ceil(total / limit);

      // Fetch paginated results joined with license info
      const data = await db
        .select({
          id: userSubmissions.id,
          name: userSubmissions.name,
          email: userSubmissions.email,
          phone: userSubmissions.phone,
          shopName: userSubmissions.shopName,
          machineId: userSubmissions.machineId,
          numberOfCashiers: userSubmissions.numberOfCashiers,
          submissionDate: userSubmissions.submissionDate,
          ipAddress: userSubmissions.ipAddress,
          licenseKey: {
            id: licenseKeys.id,
            licenseKey: licenseKeys.licenseKey,
            status: licenseKeys.status,
            expiresAt: licenseKeys.expiresAt,
          }
        })
        .from(userSubmissions)
        .leftJoin(licenseKeys, eq(userSubmissions.licenseKeyId, licenseKeys.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(userSubmissions.submissionDate));

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
      console.error(`Error in getAllSubmissions: ${error}`);
      throw new Error('Database query failed while fetching user submissions');
    }
  }
}
