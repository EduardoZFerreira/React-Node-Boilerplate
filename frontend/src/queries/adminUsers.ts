import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as adminUsersApi from "../api/adminUsers";
import type { Role } from "../types/auth";

const KEY = "admin-users";

export function useAdminUsersQuery(page: number, limit: number) {
  return useQuery({
    queryKey: [KEY, "list", { page, limit }],
    queryFn: () => adminUsersApi.listUsers({ page, limit }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserQuery(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => adminUsersApi.getUser(id as string),
    enabled: Boolean(id),
  });
}

export function useRolesQuery() {
  return useQuery({ queryKey: ["roles"], queryFn: adminUsersApi.listRoles });
}

export function useAddRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminUsersApi.addRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRemoveRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminUsersApi.removeRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAssignTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tenantId }: { id: string; tenantId: string }) => adminUsersApi.assignTenant(id, tenantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
