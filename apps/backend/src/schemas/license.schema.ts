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
