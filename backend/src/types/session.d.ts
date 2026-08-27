import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    email: string;
    roles: string[];
    tenantId?: string;
    absoluteExpiry: number;
  }
}
