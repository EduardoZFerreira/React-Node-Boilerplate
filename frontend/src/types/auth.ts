export const ROLES = ["Admin", "TenantManager", "User"] as const;
export type Role = (typeof ROLES)[number];

export interface AuthUser {
  id: string;
  email: string;
  roles: Role[];
  tenantId?: string;
}
