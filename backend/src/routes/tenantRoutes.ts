import { Request, Response, Router } from 'express';
import { UserService } from '../services/UserService';
import { requireSession } from '../middleware/requireSession';
import { requireRole } from '../middleware/requireRole';
import { blockIfMustResetPassword } from '../middleware/blockIfMustResetPassword';
import { validateBody, validateQuery } from '../middleware/validateBody';
import { CreateUserInTenantSchema } from '../schemas/userSchema';
import { PaginationSchema } from '../schemas/itemSchema';
import { Role } from '../config/roles';
import { AppError } from '../errors/AppError';

export const tenantRoutes = Router();

tenantRoutes.use(requireSession, blockIfMustResetPassword);

/**
 * @swagger
 * /tenant/users:
 *   post:
 *     summary: Create a user inside a tenant
 *     description: >
 *       **TenantManager**: creates the user in their own tenant (tenantId from session — body field ignored).
 *
 *       **Admin**: can pass `tenantId` in the body to create in any tenant; if omitted, uses their own tenantId.
 *     tags: [Tenant]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, surname, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               tenantId:
 *                 type: string
 *                 description: Admin-only override. TenantManagers always use their own tenant.
 *     responses:
 *       201:
 *         description: User created and assigned to tenant
 *       400:
 *         description: Validation error, email already in use, or no tenant context available
 *       403:
 *         description: Insufficient permissions — requires TenantManager or Admin role
 */
tenantRoutes.post(
  '/users',
  requireRole(Role.TENANT_MANAGER, Role.ADMIN),
  validateBody(CreateUserInTenantSchema),
  async (req: Request, res: Response) => {
    const isAdmin = req.authUser!.roles.includes(Role.ADMIN);

    // Admin can override tenantId via body; TenantManager always uses their own
    const tenantId = isAdmin && req.body.tenantId
      ? req.body.tenantId
      : req.authUser!.tenantId;

    if (!tenantId) {
      throw new AppError(
        400,
        isAdmin
          ? 'Provide tenantId in the request body to assign this user to a tenant'
          : 'Your account is not associated with any tenant',
      );
    }

    const result = await new UserService().createUserInTenant(req.body, tenantId);
    res.status(result.hasError ? 400 : 201).json(result);
  },
);

/**
 * @swagger
 * /tenant/users:
 *   get:
 *     summary: List users in a tenant
 *     description: >
 *       **TenantManager**: lists users in their own tenant (tenantId from session — query param ignored).
 *
 *       **Admin**: can pass `tenantId` as a query param to list any tenant's users; if omitted, uses their own tenantId.
 *     tags: [Tenant]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: tenantId
 *         schema: { type: string }
 *         description: Admin-only override. TenantManagers always use their own tenant.
 *     responses:
 *       200:
 *         description: Paginated user list scoped to the tenant
 *       400:
 *         description: No tenant context available
 *       403:
 *         description: Insufficient permissions — requires TenantManager or Admin role
 */
tenantRoutes.get(
  '/users',
  requireRole(Role.TENANT_MANAGER, Role.ADMIN),
  validateQuery(PaginationSchema),
  async (req: Request, res: Response) => {
    const isAdmin = req.authUser!.roles.includes(Role.ADMIN);
    const { page, limit } = PaginationSchema.parse(req.query);

    // Admin can override tenantId via query; TenantManager always uses their own
    const tenantId = isAdmin && req.query.tenantId
      ? (req.query.tenantId as string)
      : req.authUser!.tenantId;

    if (!tenantId) {
      throw new AppError(
        400,
        isAdmin
          ? "Provide tenantId as a query param to list that tenant's users"
          : 'Your account is not associated with any tenant',
      );
    }

    const result = await new UserService().listUsersInTenant(tenantId, page, limit);
    res.status(200).json({ hasError: false, errors: [], ...result });
  },
);
