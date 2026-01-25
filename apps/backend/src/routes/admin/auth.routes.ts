import { Hono } from 'hono';
import { db } from '../../db/db';
import { adminUsers } from '../../db/schema';
import { registerAdminSchema, type RegisterAdminInput } from '../../schemas/admin.schema';
import { zValidator } from '../../middleware/validator';
import { hashPassword } from '../../utils/password';
import { sql } from 'drizzle-orm';

const authRoutes = new Hono();

/**
 * POST /api/admin/register
 * Restricted endpoint to create the first admin user
 */
authRoutes.post(
  '/register',
  zValidator(registerAdminSchema),
  async (c) => {
    try {
      // 1. Check if any admin users exist
      const [adminCount] = await db.select({ count: sql<number>`count(*)` }).from(adminUsers);
      
      if (adminCount.count > 0) {
        return c.json({
          success: false,
          message: 'Registration is restricted. Admin user already exists.'
        }, 403);
      }

      const { username, email, password } = (c as any).get('validated') as RegisterAdminInput;

      // 2. Hash the password
      const hashedPassword = await hashPassword(password);

      // 3. Create the admin user
      await db.insert(adminUsers).values({
        username,
        email,
        hashedPassword,
      });

      return c.json({
        success: true,
        message: 'Admin user registered successfully'
      }, 201);

    } catch (error) {
      console.error('Error in admin registration:', error);
      return c.json({
        success: false,
        message: 'An error occurred during registration'
      }, 500);
    }
  }
);

export default authRoutes;
