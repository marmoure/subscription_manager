import { z } from 'zod';

export const licenseSchema = z.object({
  key: z.string(),
  active: z.boolean(),
  // Add more fields as needed
});

export type License = z.infer<typeof licenseSchema>;
