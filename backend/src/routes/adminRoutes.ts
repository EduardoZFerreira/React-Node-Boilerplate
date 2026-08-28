import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { requireSession } from '../middleware/requireSession';
import { requireRole } from '../middleware/requireRole';
import { blockIfMustResetPassword } from '../middleware/blockIfMustResetPassword';
import { validateBody, validateQuery } from '../middleware/validateBody';
import { PaginationSchema } from '../schemas/itemSchema';
import { CreateTenantSchema, UpdateTenantSchema } from '../schemas/tenantSchema';
import { AddRoleSchema, AssignTenantSchema } from '../schemas/adminSchema';
import { Role } from '../config/roles';

export const adminRoutes = Router();

adminRoutes.use(requireSession, blockIfMustResetPassword, requireRole(Role.ADMIN));

// --- Roles ---

/**
 * @swagger
 * /admin/roles:
 *   get:
 *     summary: List all available roles
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Role list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasError: { type: boolean, example: false }
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 */
adminRoutes.get('/roles', async (req, res) => {
  await new AdminController().listRoles(req, res);
});

// --- Users ---

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated user list
 *       403:
 *         description: Requires Admin role
 */
adminRoutes.get('/users', validateQuery(PaginationSchema), async (req, res) => {
  await new AdminController().listUsers(req, res);
});

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
adminRoutes.get('/users/:id', async (req, res) => {
  await new AdminController().getUser(req, res);
});

/**
 * @swagger
 * /admin/users/{id}/roles:
 *   post:
 *     summary: Add a role to a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Admin, TenantManager, User]
 *     responses:
 *       200:
 *         description: Role added
 *       404:
 *         description: User not found
 */
adminRoutes.post('/users/:id/roles', validateBody(AddRoleSchema), async (req, res) => {
  await new AdminController().addRole(req, res);
});

/**
 * @swagger
 * /admin/users/{id}/roles/{role}:
 *   delete:
 *     summary: Remove a role from a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: role
 *         required: true
 *         schema: { type: string, enum: [Admin, TenantManager, User] }
 *     responses:
 *       200:
 *         description: Role removed
 *       404:
 *         description: User not found
 */
adminRoutes.delete('/users/:id/roles/:role', async (req, res) => {
  await new AdminController().removeRole(req, res);
});

/**
 * @swagger
 * /admin/users/{id}/tenant:
 *   post:
 *     summary: Assign a tenant to a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId]
 *             properties:
 *               tenantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant assigned
 *       404:
 *         description: User or tenant not found
 */
adminRoutes.post('/users/:id/tenant', validateBody(AssignTenantSchema), async (req, res) => {
  await new AdminController().assignTenant(req, res);
});

// --- Tenants ---

/**
 * @swagger
 * /admin/tenants:
 *   get:
 *     summary: List all tenants
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated tenant list
 */
adminRoutes.get('/tenants', validateQuery(PaginationSchema), async (req, res) => {
  await new AdminController().listTenants(req, res);
});

/**
 * @swagger
 * /admin/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *               plan:
 *                 type: string
 *                 enum: [free, pro, enterprise]
 *     responses:
 *       201:
 *         description: Tenant created
 *       409:
 *         description: Slug already in use
 */
adminRoutes.post('/tenants', validateBody(CreateTenantSchema), async (req, res) => {
  await new AdminController().createTenant(req, res);
});

/**
 * @swagger
 * /admin/tenants/{id}:
 *   patch:
 *     summary: Update a tenant
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               plan:
 *                 type: string
 *                 enum: [free, pro, enterprise]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tenant updated
 *       404:
 *         description: Tenant not found
 */
adminRoutes.patch('/tenants/:id', validateBody(UpdateTenantSchema), async (req, res) => {
  await new AdminController().updateTenant(req, res);
});
