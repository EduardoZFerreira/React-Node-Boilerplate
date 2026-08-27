import { z } from 'zod';
import { Role } from '../config/roles';

export const AddRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const AssignTenantSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
});
