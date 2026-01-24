import { z } from 'zod';

export const adminSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.literal('admin'),
  // Add more fields as needed
});

export type Admin = z.infer<typeof adminSchema>;
