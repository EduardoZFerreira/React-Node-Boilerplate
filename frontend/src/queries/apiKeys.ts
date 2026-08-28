import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as apiKeysApi from "../api/apiKeys";
import type { CreateApiKeyInput } from "../types/apiKey";

const KEY = "api-keys";

export function useApiKeysQuery() {
  return useQuery({ queryKey: [KEY], queryFn: apiKeysApi.listApiKeys });
}

export function useCreateApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApiKeyInput) => apiKeysApi.createApiKey(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRevokeApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revokeApiKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
