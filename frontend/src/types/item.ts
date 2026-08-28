export interface Item {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  tenantId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemInput {
  title: string;
  description?: string;
}

export interface UpdateItemInput {
  title?: string;
  description?: string | null;
  isActive?: boolean;
}
