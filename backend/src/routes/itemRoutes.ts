import { Router } from 'express';
import { ItemController } from '../controllers/ItemController';
import { requireAuth } from '../middleware/requireAuth';
import { resolveTenant } from '../middleware/resolveTenant';
import { validateBody, validateQuery } from '../middleware/validateBody';
import { CreateItemSchema, UpdateItemSchema, PaginationSchema } from '../schemas/itemSchema';

export const itemRoutes = Router();

itemRoutes.use(resolveTenant);

/**
 * @swagger
 * /items:
 *   get:
 *     summary: List items
 *     description: Returns paginated items. Scoped to tenant if X-Tenant-ID header is present. API keys require items:read scope.
 *     tags: [Items]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyHeader: []
 *     parameters:
 *       - in: header
 *         name: X-Tenant-ID
 *         schema: { type: string }
 *         description: Tenant slug to scope results
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated item list
 *       401:
 *         description: Not authenticated
 */
itemRoutes.get('/', requireAuth('items:read'), validateQuery(PaginationSchema), async (req, res) => {
  await new ItemController().list(req, res);
});

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get a single item by ID
 *     tags: [Items]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */
itemRoutes.get('/:id', requireAuth('items:read'), async (req, res) => {
  await new ItemController().getById(req, res);
});

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Item created
 *       401:
 *         description: Not authenticated
 */
itemRoutes.post('/', requireAuth('items:write'), validateBody(CreateItemSchema), async (req, res) => {
  await new ItemController().create(req, res);
});

/**
 * @swagger
 * /items/{id}:
 *   patch:
 *     summary: Update an item
 *     description: Admins can update any item; regular users can only update their own.
 *     tags: [Items]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item updated
 *       403:
 *         description: Not your item
 *       404:
 *         description: Item not found
 */
itemRoutes.patch('/:id', requireAuth('items:write'), validateBody(UpdateItemSchema), async (req, res) => {
  await new ItemController().update(req, res);
});

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete an item
 *     description: Admins can delete any item; regular users can only delete their own.
 *     tags: [Items]
 *     security:
 *       - cookieAuth: []
 *       - apiKeyHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Item deleted
 *       403:
 *         description: Not your item
 *       404:
 *         description: Item not found
 */
itemRoutes.delete('/:id', requireAuth('items:write'), async (req, res) => {
  await new ItemController().delete(req, res);
});
