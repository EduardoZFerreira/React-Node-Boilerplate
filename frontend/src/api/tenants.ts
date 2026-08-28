import { apiClient } from "./client";
import type { ApiEnvelope, PaginatedEnvelope } from "../types/api";
import type { CreateTenantInput, Tenant, UpdateTenantInput } from "../types/tenant";

interface ListParams {
  page: number;
  limit: number;
}

export async function listTenants({ page, limit }: ListParams): Promise<PaginatedEnvelope<"tenants", Tenant>> {
  const { data } = await apiClient.get<PaginatedEnvelope<"tenants", Tenant>>("/admin/tenants", {
    params: { page, limit },
  });
  return data;
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const { data } = await apiClient.post<ApiEnvelope & { tenant: Tenant }>("/admin/tenants", input);
  return data.tenant;
}

export async function updateTenant(id: string, input: UpdateTenantInput): Promise<Tenant> {
  const { data } = await apiClient.patch<ApiEnvelope & { tenant: Tenant }>(`/admin/tenants/${id}`, input);
  return data.tenant;
}
