import { apiClient } from "./client";
import type { AdminUser, RoleOption } from "../types/adminUser";
import type { ApiEnvelope, PaginatedEnvelope } from "../types/api";
import type { Role } from "../types/auth";

interface ListParams {
  page: number;
  limit: number;
}

export async function listUsers({ page, limit }: ListParams): Promise<PaginatedEnvelope<"users", AdminUser>> {
  const { data } = await apiClient.get<PaginatedEnvelope<"users", AdminUser>>("/admin/users", {
    params: { page, limit },
  });
  return data;
}

export async function getUser(id: string): Promise<AdminUser> {
  const { data } = await apiClient.get<ApiEnvelope & { user: AdminUser }>(`/admin/users/${id}`);
  return data.user;
}

export async function addRole(id: string, role: Role): Promise<AdminUser> {
  const { data } = await apiClient.post<ApiEnvelope & { user: AdminUser }>(`/admin/users/${id}/roles`, { role });
  return data.user;
}

export async function removeRole(id: string, role: Role): Promise<AdminUser> {
  const { data } = await apiClient.delete<ApiEnvelope & { user: AdminUser }>(`/admin/users/${id}/roles/${role}`);
  return data.user;
}

export async function assignTenant(id: string, tenantId: string): Promise<AdminUser> {
  const { data } = await apiClient.post<ApiEnvelope & { user: AdminUser }>(`/admin/users/${id}/tenant`, {
    tenantId,
  });
  return data.user;
}

export async function listRoles(): Promise<RoleOption[]> {
  const { data } = await apiClient.get<ApiEnvelope & { roles: RoleOption[] }>("/admin/roles");
  return data.roles;
}
