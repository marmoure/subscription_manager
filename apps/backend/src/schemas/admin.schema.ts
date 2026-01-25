import { z } from 'zod';

export const adminSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  isActive: z.boolean(),
  createdAt: z.date(),
  lastLoginAt: z.date().nullable(),
});

export type Admin = z.infer<typeof adminSchema>;

export const registerAdminSchema = z.object({
  username: z.string()
    .min(4, 'Username must be at least 4 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Username must be alphanumeric'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;

export const loginAdminSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginAdminInput = z.infer<typeof loginAdminSchema>;