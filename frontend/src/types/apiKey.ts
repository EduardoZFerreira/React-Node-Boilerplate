export const AVAILABLE_SCOPES = ["items:read", "items:write", "admin"] as const;
export type ApiKeyScope = (typeof AVAILABLE_SCOPES)[number];

export interface ApiKey {
  id: string;
  label: string;
  scopes: ApiKeyScope[];
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateApiKeyInput {
  label: string;
  scopes: ApiKeyScope[];
  expiresAt?: string;
}
