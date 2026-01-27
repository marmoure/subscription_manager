import { z } from 'zod';

export const submitLicenseRequestSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .refine(val => !/[<>]/.test(val), { message: "Name contains invalid characters (< or >)" }),

  machineId: z.string()
    .min(1, 'Machine ID is required')
    .max(50, 'Machine ID is too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Machine ID must be alphanumeric'),

  phone: z.string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format (must be 7-15 digits)'),

  shopName: z.string()
    .min(2, 'Shop name must be at least 2 characters')
    .max(100, 'Shop name must be less than 100 characters')
    .refine(val => !/[<>]/.test(val), { message: "Shop name contains invalid characters (< or >)" }),

  numberOfCashiers: z.number()
    .int('Number of cashiers must be an integer')
    .min(1, 'Number of cashiers must be at least 1')
    .max(50, 'Number of cashiers cannot exceed 50'),

  captchaToken: z.string().min(1, 'CAPTCHA token is required'),
  website: z.string().max(255).optional(),
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
