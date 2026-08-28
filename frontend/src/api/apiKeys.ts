import { apiClient } from "./client";
import type { ApiEnvelope } from "../types/api";
import type { ApiKey, CreateApiKeyInput } from "../types/apiKey";

export async function listApiKeys(): Promise<ApiKey[]> {
  const { data } = await apiClient.get<ApiEnvelope & { keys: ApiKey[] }>("/api-keys");
  return data.keys;
}

export async function createApiKey(input: CreateApiKeyInput): Promise<{ apiKey: ApiKey; rawKey: string }> {
  const { data } = await apiClient.post<ApiEnvelope & { apiKey: ApiKey; rawKey: string }>("/api-keys", input);
  return { apiKey: data.apiKey, rawKey: data.rawKey };
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiClient.delete(`/api-keys/${id}`);
}
