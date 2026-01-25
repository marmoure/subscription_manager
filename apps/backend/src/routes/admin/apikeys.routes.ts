import { Hono } from 'hono';
import { db } from '../../db/db';
import { apiKeys } from '../../db/schema';
import { authenticateAdmin, type AdminVariables } from '../../middleware/authenticateAdmin';
import { zValidator } from '../../middleware/validator';
import { createApiKeySchema, type CreateApiKeyInput } from '../../schemas/api-key.schema';
import { generateApiKey } from '../../utils/apiKeyGenerator';
import { sql, eq } from 'drizzle-orm';

const adminApiKeyRoutes = new Hono<{ Variables: AdminVariables }>();

adminApiKeyRoutes.post(
  '/api-keys',
  authenticateAdmin,
  zValidator('json', createApiKeySchema),
  async (c) => {
    const { name } = c.get('validated') as CreateApiKeyInput;
    const admin = c.get('admin');

    try {
      // Check active API keys limit (max 10)
      const [result] = await db.select({ count: sql<number>`count(*)` })
        .from(apiKeys)
        .where(eq(apiKeys.isActive, true));

      if (result.count >= 10) {
        return c.json({
          success: false,
          message: 'Limit reached: Maximum 10 active API keys allowed'
        }, 400);
      }

      // Generate new API key
      const key = generateApiKey();

      // Log creation (simulated log as per requirements)
      console.log(`API Key created by Admin ID ${admin.id} (${admin.username}): ${name}`);

      // Insert into database
      // Storing plain text key to maintain compatibility with existing validateApiKey middleware
      const [newApiKey] = await db.insert(apiKeys).values({
        key,
        name,
        isActive: true,
        createdAt: new Date(),
        usageCount: 0
      }).returning();

      // Return the full key and metadata
      return c.json({
        success: true,
        data: {
          ...newApiKey,
          // Explicit warning as requested
          warning: 'This is the only time the full API key will be shown. Please save it securely.'
        }
      }, 201);

    } catch (error) {
      console.error('Error creating API key:', error);
      return c.json({
        success: false,
        message: 'Internal server error'
      }, 500);
    }
  }
);

export default adminApiKeyRoutes;
