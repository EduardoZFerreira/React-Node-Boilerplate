import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as tenantsApi from "../api/tenants";
import type { CreateTenantInput, UpdateTenantInput } from "../types/tenant";

const KEY = "tenants";

export function useTenantsQuery(page: number, limit: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [KEY, "list", { page, limit }],
    queryFn: () => tenantsApi.listTenants({ page, limit }),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) => tenantsApi.createTenant(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTenantInput }) => tenantsApi.updateTenant(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
