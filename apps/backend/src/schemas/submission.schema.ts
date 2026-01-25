import { z } from 'zod';

export const submitLicenseRequestSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  machineId: z.string().min(1, 'Machine ID is required'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  shopName: z.string().min(1, 'Shop name is required'),
  email: z.string().email('Invalid email address'),
  numberOfCashiers: z.number().int().positive('Number of cashiers must be a positive integer'),
  captchaToken: z.string().min(1, 'CAPTCHA token is required'),
});

export type SubmitLicenseRequestInput = z.infer<typeof submitLicenseRequestSchema>;
