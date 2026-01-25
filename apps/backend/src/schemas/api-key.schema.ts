import { z } from 'zod';

export const apiKeySchema = z.object({
  key: z.string(),
  scopes: z.array(z.string()).optional(),
  // Add more fields as needed
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
});

export type ApiKey = z.infer<typeof apiKeySchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;