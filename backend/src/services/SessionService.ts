import { Request } from 'express';

interface SessionUser {
  id: string;
  email: string;
  roles: string[];
  tenantId?: string;
  mustResetPassword?: boolean;
}

const ABSOLUTE_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class SessionService {
  static populate(req: Request, user: SessionUser): void {
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.roles = user.roles;
    req.session.tenantId = user.tenantId ?? undefined;
    req.session.mustResetPassword = user.mustResetPassword ?? false;
    req.session.absoluteExpiry = Date.now() + ABSOLUTE_SESSION_TTL_MS;
  }

  static destroy(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static getUser(req: Request): SessionUser | null {
    if (!req.session?.userId) return null;
    if (Date.now() > (req.session.absoluteExpiry ?? 0)) return null;

    return {
      id: req.session.userId,
      email: req.session.email!,
      roles: req.session.roles ?? [],
      tenantId: req.session.tenantId,
      mustResetPassword: req.session.mustResetPassword ?? false,
    };
  }
}

export { SessionService, SessionUser };
