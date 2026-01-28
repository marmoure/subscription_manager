import { Hono } from 'hono';
import { db } from '../../db/db';
import { adminUsers, refreshTokens } from '../../db/schema';
import { registerAdminSchema, loginAdminSchema, changePasswordSchema, type RegisterAdminInput, type LoginAdminInput, type ChangePasswordInput } from '../../schemas/admin.schema';
import { zValidator } from '../../middleware/validator';
import { hashPassword, verifyPassword } from '../../utils/password';
import { verifyToken, generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { rateLimiter } from '../../middleware/rateLimiter';
import { authenticateAdmin, type AdminVariables } from '../../middleware/authenticateAdmin';
import { sql, eq, or, and, isNull } from 'drizzle-orm';

const authRoutes = new Hono()
  /**
   * POST /api/admin/refresh-token
   * Refresh access token using a valid refresh token
   */
  .post(
    '/refresh-token',
    async (c) => {
      try {
        const { refreshToken } = await c.req.json();

        if (!refreshToken) {
          return c.json({
            success: false,
            message: 'Refresh token is required'
          }, 400);
        }

        // Verify refresh token
        let payload;
        try {
          payload = verifyToken(refreshToken);
        } catch (error) {
          return c.json({
            success: false,
            message: 'Invalid or expired refresh token'
          }, 401);
        }

        // Check if token is in database and not revoked
        const [storedToken] = await db
          .select()
          .from(refreshTokens)
          .where(
            and(
              eq(refreshTokens.token, refreshToken),
              isNull(refreshTokens.revokedAt)
            )
          )
          .limit(1);

        if (!storedToken) {
          return c.json({
            success: false,
            message: 'Refresh token has been revoked or is invalid'
          }, 401);
        }

        const newAccessToken = generateAccessToken({
          adminId: payload.adminId,
          username: payload.username
        });

        const newRefreshToken = generateRefreshToken({
          adminId: payload.adminId,
          username: payload.username
        });

        // Revoke old token and store new one
        db.transaction((tx) => {
          tx.update(refreshTokens)
            .set({ revokedAt: new Date() })
            .where(eq(refreshTokens.id, storedToken.id))
            .run();

          tx.insert(refreshTokens).values({
            adminId: payload.adminId,
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          }).run();
        });

        return c.json({
          success: true,
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        });
      } catch (error) {
        console.error('Error in refresh token:', error);
        return c.json({
          success: false,
          message: 'An error occurred during token refresh'
        }, 500);
      }
    }
  )
  /**
   * POST /api/admin/logout
   * Log out the current user by revoking the refresh token
   */
  .post(
    '/logout',
    async (c) => {
      try {
        const { refreshToken } = await c.req.json();

        if (refreshToken) {
          await db
            .update(refreshTokens)
            .set({ revokedAt: new Date() })
            .where(eq(refreshTokens.token, refreshToken));
        }

        return c.json({
          success: true,
          message: 'Logged out successfully'
        });
      } catch (error) {
        console.error('Logout error:', error);
        return c.json({
          success: false,
          message: 'Logout failed'
        }, 500);
      }
    }
  )
  /**
   * POST /api/admin/logout-all
   * Log out from all devices by revoking all refresh tokens for the user
   */
  .post(
    '/logout-all',
    authenticateAdmin,
    async (c) => {
      try {
        const admin = (c as any).get('admin');

        await db
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(refreshTokens.adminId, admin.id),
              isNull(refreshTokens.revokedAt)
            )
          );

        return c.json({
          success: true,
          message: 'Logged out from all devices successfully'
        });
      } catch (error) {
        console.error('Logout all error:', error);
        return c.json({
          success: false,
          message: 'Logout all failed'
        }, 500);
      }
    }
  )
  /**
   * POST /api/admin/login
   * Authenticate admin user and return JWT tokens
   */
  .post(
    '/login',
    rateLimiter,
    zValidator('json', loginAdminSchema),
    async (c) => {
      try {
        const { username, password } = (c as any).get('validatedJson') as LoginAdminInput;

        // 1. Find user by username
        const [admin] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.username, username))
          .limit(1);

        // 2. Validate user and password
        if (!admin || !admin.isActive) {
          return c.json({
            success: false,
            message: 'Invalid username or password'
          }, 401);
        }

        const isPasswordValid = await verifyPassword(password, admin.hashedPassword);
        if (!isPasswordValid) {
          return c.json({
            success: false,
            message: 'Invalid username or password'
          }, 401);
        }

        // 3. Generate tokens
        const payload = {
          adminId: admin.id,
          username: admin.username,
        };

        const accessToken = generateAccessToken(payload, '24h');
        const refreshToken = generateRefreshToken(payload, '7d');

        // 4. Store refresh token in DB
        await db.insert(refreshTokens).values({
          adminId: admin.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        // 5. Update lastLoginAt
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
              role: admin.role
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
  )
  /**
   * POST /api/admin/register
   * Restricted endpoint to create the first admin user
   */
  .post(
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

        const { username, password } = (c as any).get('validatedJson') as RegisterAdminInput;

        // 2. Hash the password
        const hashedPassword = await hashPassword(password);

        // 3. Create the admin user
        await db.insert(adminUsers).values({
          username,
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
  )
  /**
   * POST /api/admin/change-password
   * Change password for the currently authenticated admin
   */
  .post(
    '/change-password',
    authenticateAdmin,
    zValidator('json', changePasswordSchema),
    async (c) => {
      try {
        const admin = (c as any).get('admin');
        const { currentPassword, newPassword } = (c as any).get('validatedJson') as ChangePasswordInput;

        // 1. Get current admin from DB
        const [dbAdmin] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, admin.id))
          .limit(1);

        if (!dbAdmin) {
          return c.json({
            success: false,
            message: 'Admin user not found'
          }, 404);
        }

        // 2. Verify current password
        const isPasswordValid = await verifyPassword(currentPassword, dbAdmin.hashedPassword);
        if (!isPasswordValid) {
          return c.json({
            success: false,
            message: 'Invalid current password'
          }, 400);
        }

        // 3. Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // 4. Update password in DB
        await db
          .update(adminUsers)
          .set({ hashedPassword: hashedNewPassword })
          .where(eq(adminUsers.id, admin.id));

        return c.json({
          success: true,
          message: 'Password changed successfully'
        });

      } catch (error) {
        console.error('Error in change password:', error);
        return c.json({
          success: false,
          message: 'An error occurred during password change'
        }, 500);
      }
    }
  );

export default authRoutes;
