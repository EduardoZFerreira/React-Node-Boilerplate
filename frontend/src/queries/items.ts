import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as itemsApi from "../api/items";
import type { CreateItemInput, UpdateItemInput } from "../types/item";

const ITEMS_KEY = "items";

export function useItemsQuery(page: number, limit: number) {
  return useQuery({
    queryKey: [ITEMS_KEY, "list", { page, limit }],
    queryFn: () => itemsApi.listItems({ page, limit }),
    placeholderData: keepPreviousData,
  });
}

export function useItemQuery(id: string | undefined) {
  return useQuery({
    queryKey: [ITEMS_KEY, "detail", id],
    queryFn: () => itemsApi.getItem(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) => itemsApi.createItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] }),
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateItemInput }) => itemsApi.updateItem(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] }),
  });
}

export function useDeleteItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.deleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] }),
  });
}
