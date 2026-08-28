import { apiClient } from "./client";
import type { AdminUser } from "../types/adminUser";
import type { ApiEnvelope, PaginatedEnvelope } from "../types/api";

export interface CreateTenantUserInput {
  name: string;
  surname: string;
  email: string;
  password: string;
  tenantId?: string;
}

export async function createTenantUser(input: CreateTenantUserInput): Promise<{ id: string }> {
  const { data } = await apiClient.post<ApiEnvelope & { id: string }>("/tenant/users", input);
  return data;
}

interface ListTenantUsersParams {
  page: number;
  limit: number;
  tenantId?: string;
}

export async function listTenantUsers({
  page,
  limit,
  tenantId,
}: ListTenantUsersParams): Promise<PaginatedEnvelope<"users", AdminUser>> {
  const { data } = await apiClient.get<PaginatedEnvelope<"users", AdminUser>>("/tenant/users", {
    params: { page, limit, ...(tenantId ? { tenantId } : {}) },
  });
  return data;
}
