import { apiClient } from "./client";
import type { ApiEnvelope, PaginatedEnvelope } from "../types/api";
import type { CreateItemInput, Item, UpdateItemInput } from "../types/item";

interface ListItemsParams {
  page: number;
  limit: number;
}

export async function listItems({ page, limit }: ListItemsParams): Promise<PaginatedEnvelope<"items", Item>> {
  const { data } = await apiClient.get<PaginatedEnvelope<"items", Item>>("/items", { params: { page, limit } });
  return data;
}

export async function getItem(id: string): Promise<Item> {
  const { data } = await apiClient.get<ApiEnvelope & { item: Item }>(`/items/${id}`);
  return data.item;
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const { data } = await apiClient.post<ApiEnvelope & { item: Item }>("/items", input);
  return data.item;
}

export async function updateItem(id: string, input: UpdateItemInput): Promise<Item> {
  const { data } = await apiClient.patch<ApiEnvelope & { item: Item }>(`/items/${id}`, input);
  return data.item;
}

export async function deleteItem(id: string): Promise<void> {
  await apiClient.delete(`/items/${id}`);
}
