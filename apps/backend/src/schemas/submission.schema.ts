import { z } from 'zod';

export const submitLicenseRequestSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  machineId: z.string().min(1, 'Machine ID is required'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  shopName: z.string().min(1, 'Shop name is required'),
  email: z.string().email('Invalid email address'),
  numberOfCashiers: z.number().int().positive('Number of cashiers must be a positive integer'),
  captchaToken: z.string().min(1, 'CAPTCHA token is required'),
  website: z.string().optional(),
});

export type SubmitLicenseRequestInput = z.infer<typeof submitLicenseRequestSchema>;

export const listSubmissionsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)).pipe(z.number().min(1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)).pipe(z.number().min(1).max(100)),
  search: z.string().optional(),
  startDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid startDate" }),
  endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid endDate" }),
  numberOfCashiers: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)).pipe(z.number().optional()),
  minCashiers: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)).pipe(z.number().optional()),
  maxCashiers: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)).pipe(z.number().optional()),
});

export type ListSubmissionsQueryInput = z.infer<typeof listSubmissionsQuerySchema>;
