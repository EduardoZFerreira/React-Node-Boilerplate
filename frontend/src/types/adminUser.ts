import type { Role } from "./auth";

export interface AdminUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  roles: Role[];
  tenantId?: string;
  createdAt: string;
}

export interface RoleOption {
  id: string;
  title: string;
}
