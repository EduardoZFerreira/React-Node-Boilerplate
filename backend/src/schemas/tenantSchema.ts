import { z } from 'zod';

const domainField = z
  .string()
  .max(255)
  .regex(/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/, 'Domain must look like example.com')
  .transform((value) => value.toLowerCase())
  .optional();

export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
  // Optional: ties this tenant to an email domain so a later self-registration
  // from that domain is routed to "contact your manager" instead of creating
  // a duplicate organization (see UserService.createUser).
  domain: domainField,
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  isActive: z.boolean().optional(),
  domain: domainField,
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
