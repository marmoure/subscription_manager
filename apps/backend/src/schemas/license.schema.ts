import { z } from 'zod';

export const licenseSchema = z.object({
  key: z.string(),
  active: z.boolean(),
  // Add more fields as needed
});

export type License = z.infer<typeof licenseSchema>;

export const verifyLicenseSchema = z.object({
  machineId: z.string().min(3, 'Machine ID must be at least 3 characters').max(255, 'Machine ID is too long'),
});

export type VerifyLicenseInput = z.infer<typeof verifyLicenseSchema>;

export const listLicensesQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)).pipe(z.number().min(1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)).pipe(z.number().min(1).max(100)),
  status: z.enum(['active', 'inactive', 'revoked']).optional(),
});

export type ListLicensesQueryInput = z.infer<typeof listLicensesQuerySchema>;

export const getLicenseByIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid integer').transform((val) => parseInt(val, 10)),
});

export type GetLicenseByIdInput = z.infer<typeof getLicenseByIdSchema>;

export const updateLicenseStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'revoked']),
  reason: z.string().optional().describe('Reason for status change'),
});

export type UpdateLicenseStatusInput = z.infer<typeof updateLicenseStatusSchema>;
