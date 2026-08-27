import { Tenant } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  tenantId?: string;
  scopes: string[];
  authMethod: 'session' | 'apikey';
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      tenant?: Tenant;
    }
  }
}
