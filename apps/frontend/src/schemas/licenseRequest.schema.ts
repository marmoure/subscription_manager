import { z } from 'zod';

export const licenseRequestSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  machineId: z.string()
    .min(1, 'Machine ID is required')
    .regex(/^[a-zA-Z0-9]+$/, 'Machine ID must be alphanumeric'),
    
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    
  shopName: z.string()
    .min(2, 'Shop name must be at least 2 characters'),
    
  email: z.string()
    .email('Invalid email address'),
    
  numberOfCashiers: z.coerce.number()
    .int('Number of cashiers must be an integer')
    .min(1, 'Number of cashiers must be at least 1')
    .max(50, 'Number of cashiers cannot exceed 50'),

  captcha: z.string()
    .min(1, 'Please verify you are not a robot')
});

export type LicenseRequestFormValues = z.infer<typeof licenseRequestSchema>;
