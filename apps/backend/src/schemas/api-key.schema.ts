import { z } from 'zod';

export const apiKeySchema = z.object({
  key: z.string(),
  scopes: z.array(z.string()).optional(),
  // Add more fields as needed
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
});

export const listApiKeysQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
  search: z.string().optional(),
});

export const revokeApiKeySchema = z.object({
  reason: z.string().max(500, 'Reason is too long').optional(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type ListApiKeysQueryInput = z.infer<typeof listApiKeysQuerySchema>;
export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;