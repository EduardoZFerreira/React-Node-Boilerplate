export type TenantPlan = "free" | "pro" | "enterprise";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  plan?: TenantPlan;
}

export interface UpdateTenantInput {
  name?: string;
  plan?: TenantPlan;
  isActive?: boolean;
}
