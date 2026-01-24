import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  // Add more fields as needed
});

export type User = z.infer<typeof userSchema>;
