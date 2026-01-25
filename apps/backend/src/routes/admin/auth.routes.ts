import { Hono } from 'hono';
import { db } from '../../db/db';
import { adminUsers } from '../../db/schema';
import { registerAdminSchema, loginAdminSchema, type RegisterAdminInput, type LoginAdminInput } from '../../schemas/admin.schema';
import { zValidator } from '../../middleware/validator';
import { hashPassword, verifyPassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { rateLimiter } from '../../middleware/rateLimiter';
import { sql, eq, or } from 'drizzle-orm';

const authRoutes = new Hono();

/**
 * POST /api/admin/login
 * Authenticate admin user and return JWT tokens
 */
authRoutes.post(
  '/login',
  rateLimiter,
  zValidator('json', loginAdminSchema),
  async (c) => {
    try {
      const { usernameOrEmail, password } = (c as any).get('validated') as LoginAdminInput;

      // 1. Find user by username or email
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(
          or(
            eq(adminUsers.username, usernameOrEmail),
            eq(adminUsers.email, usernameOrEmail)
          )
        )
        .limit(1);

      // 2. Validate user and password (don't reveal if user doesn't exist)
      if (!admin || !admin.isActive) {
        return c.json({
          success: false,
          message: 'Invalid username/email or password'
        }, 401);
      }

      const isPasswordValid = await verifyPassword(password, admin.hashedPassword);
      if (!isPasswordValid) {
        return c.json({
          success: false,
          message: 'Invalid username/email or password'
        }, 401);
      }

      // 3. Generate tokens
      const payload = {
        adminId: admin.id,
        username: admin.username,
        email: admin.email,
      };

      const accessToken = generateAccessToken(payload, '24h');
      const refreshToken = generateRefreshToken(payload, '7d');

      // 4. Update lastLoginAt
      await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, admin.id));

      return c.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          admin: {
            id: admin.id,
            username: admin.username,
            email: admin.email
          }
        }
      });

    } catch (error) {
      console.error('Error in admin login:', error);
      return c.json({
        success: false,
        message: 'An error occurred during login'
      }, 500);
    }
  }
);

/**
 * POST /api/admin/register
 * Restricted endpoint to create the first admin user
 */
authRoutes.post(
  '/register',
  zValidator('json', registerAdminSchema),
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
