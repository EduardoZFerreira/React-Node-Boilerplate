import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as tenantUsersApi from "../api/tenantUsers";

const KEY = "tenant-users";

export function useTenantUsersQuery(
  page: number,
  limit: number,
  tenantId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [KEY, "list", { page, limit, tenantId }],
    queryFn: () => tenantUsersApi.listTenantUsers({ page, limit, tenantId }),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateTenantUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantUsersApi.createTenantUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
