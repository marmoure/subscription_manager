import { db } from '../db/db';
import { apiKeys } from '../db/schema';
import { eq, desc, and, sql, like } from 'drizzle-orm';

export class ApiKeyService {
  /**
   * Gets all API keys with pagination and optional filtering.
   * @param options Pagination and filtering options
   * @returns List of API keys (masked) and pagination metadata
   */
  static async getAllApiKeys(options: {
    page: number;
    limit: number;
    isActive?: 'true' | 'false' | 'all';
    search?: string;
  }) {
    const { page, limit, isActive, search } = options;
    const offset = (page - 1) * limit;

    try {
      const filters = [];
      if (isActive === 'true') {
        filters.push(eq(apiKeys.isActive, true));
      } else if (isActive === 'false') {
        filters.push(eq(apiKeys.isActive, false));
      }
      
      if (search) {
        filters.push(like(apiKeys.name, `%${search}%`));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      // Count total matches for pagination
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeys)
        .where(whereClause);

      const total = totalResult?.count || 0;
      const totalPages = Math.ceil(total / limit);

      // Fetch paginated results
      const data = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          key: apiKeys.key,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt,
          lastIpAddress: apiKeys.lastIpAddress,
          isActive: apiKeys.isActive,
          usageCount: apiKeys.usageCount,
        })
        .from(apiKeys)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(apiKeys.createdAt));

      // Mask keys and format response
      const formattedData = data.map(item => {
        const key = item.key;
        // Handle potential short keys gracefully, though they should be long enough
        const last4 = key.length >= 4 ? key.slice(-4) : key;
        const maskedKey = `****-****-****-${last4}`;
        
        return {
          id: item.id,
          name: item.name,
          maskedKey,
          createdAt: item.createdAt,
          lastUsedAt: item.lastUsedAt,
          isActive: !!item.isActive,
          usageCount: item.usageCount,
          metadata: {
            totalApiCalls: item.usageCount,
            lastIpAddress: item.lastIpAddress,
          }
        };
      });

      return {
        data: formattedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error(`Error in getAllApiKeys: ${error}`);
      throw new Error('Database query failed while fetching all API keys');
    }
  }
}
