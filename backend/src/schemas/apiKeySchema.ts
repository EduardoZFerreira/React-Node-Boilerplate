import { z } from 'zod';

export const AVAILABLE_SCOPES = ['items:read', 'items:write', 'admin'] as const;
export type Scope = (typeof AVAILABLE_SCOPES)[number];

export const CreateApiKeySchema = z.object({
  label: z.string().min(1, 'Label is required').max(100),
  scopes: z
    .array(z.enum(AVAILABLE_SCOPES))
    .min(1, 'At least one scope is required'),
  expiresAt: z.coerce
    .date()
    .min(new Date(), 'Expiration date must be in the future')
    .optional(),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
