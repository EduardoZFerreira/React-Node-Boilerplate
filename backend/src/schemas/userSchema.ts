import { z } from 'zod';

const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;

export const passwordField = process.env.BYPASS_PASSWORD_STRENGTH_VALIDATION
  ? z.string().min(1, 'Password is required')
  : z
      .string()
      .regex(
        passwordRegex,
        'Password must be 8-16 characters and contain at least one uppercase letter, lowercase letter, number and special character'
      );

export const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  surname: z.string().min(1, 'Surname is required'),
  email: z.string().email('Invalid email address'),
  password: passwordField,
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Used by TenantManager (tenantId auto-filled from session) and Admin (can override via tenantId body field)
export const CreateUserInTenantSchema = CreateUserSchema.extend({
  tenantId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateUserInTenantInput = z.infer<typeof CreateUserInTenantSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
