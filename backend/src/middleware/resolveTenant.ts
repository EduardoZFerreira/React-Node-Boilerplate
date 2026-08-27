import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/TenantService';
import { AppError } from '../errors/AppError';

// Resolves tenant context in priority order:
//   1. X-Tenant-ID header (slug) — explicit override, useful for admin/multi-tenant clients
//   2. authUser.tenantId          — implicit, auto-populated from the user's own tenant at login
//   3. Neither                    — req.tenant stays undefined (global / non-tenant context)
async function resolveTenant(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const slug = req.headers['x-tenant-id'];

  if (slug && typeof slug === 'string') {
    const tenant = await new TenantService().getBySlug(slug);
    if (!tenant.isActive) throw new AppError(403, `Tenant '${slug}' is inactive`);
    req.tenant = tenant;
    next();
    return;
  }

  const tenantId = req.authUser?.tenantId;
  if (tenantId) {
    const tenant = await new TenantService().getById(tenantId);
    if (!tenant.isActive) throw new AppError(403, 'Your tenant account is inactive');
    req.tenant = tenant;
  }

  next();
}

export { resolveTenant };
