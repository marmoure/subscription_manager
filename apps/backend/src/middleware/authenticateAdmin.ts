import { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';
import { db } from '../db/db';
import { adminUsers } from '../db/schema';
import { eq } from 'drizzle-orm';

export type AdminVariables = {
  admin: {
    id: number;
    username: string;
    email: string;
  }
};

/**
 * Middleware to authenticate admin requests using JWT.
 * Extracts token from Authorization: Bearer <token> header.
 * Verifies the token and checks if the admin user exists and is active.
 */
export const authenticateAdmin = async (c: Context<{ Variables: AdminVariables }>, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      success: false, 
      message: 'Unauthorized: Missing or invalid token format' 
    }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    
    // Check if admin user exists and is active in the database
    // This provides an extra layer of security in case an account is disabled
    const [admin] = await db.select({
      id: adminUsers.id,
      username: adminUsers.username,
      email: adminUsers.email,
      isActive: adminUsers.isActive
    })
      .from(adminUsers)
      .where(eq(adminUsers.id, payload.userId))
      .limit(1);

    if (!admin) {
      return c.json({ 
        success: false, 
        message: 'Unauthorized: Admin user not found' 
      }, 401);
    }

    if (!admin.isActive) {
      return c.json({ 
        success: false, 
        message: 'Unauthorized: Admin account is inactive' 
      }, 401);
    }

    // Attach admin user information to request context
    c.set('admin', {
      id: admin.id,
      username: admin.username,
      email: admin.email
    });

    await next();
  } catch (error) {
    let message = 'Invalid token';
    
    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        message = 'Token has expired';
      } else if (error.message === 'Invalid token') {
        message = 'Invalid token signature';
      } else {
        message = error.message;
      }
    }

    return c.json({ 
      success: false, 
      message: `Unauthorized: ${message}` 
    }, 401);
  }
};
