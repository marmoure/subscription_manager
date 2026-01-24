import { z } from 'zod';

export const apiKeySchema = z.object({
  key: z.string(),
  scopes: z.array(z.string()),
  // Add more fields as needed
});

export type ApiKey = z.infer<typeof apiKeySchema>;
