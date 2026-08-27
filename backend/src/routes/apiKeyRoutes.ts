import { Router } from 'express';
import { ApiKeyController } from '../controllers/ApiKeyController';
import { requireSession } from '../middleware/requireSession';
import { validateBody } from '../middleware/validateBody';
import { CreateApiKeySchema } from '../schemas/apiKeySchema';

export const apiKeyRoutes = Router();

// Session-only: API keys cannot be used to manage API keys
apiKeyRoutes.use(requireSession);

/**
 * @swagger
 * /api-keys:
 *   post:
 *     summary: Create a new API key
 *     description: >
 *       The raw key is returned ONLY in this response — it is never stored and cannot be retrieved again.
 *       Store it securely immediately.
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, scopes]
 *             properties:
 *               label:
 *                 type: string
 *                 maxLength: 100
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [items:read, items:write, admin]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Key created — rawKey shown only once
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasError: { type: boolean, example: false }
 *                 rawKey: { type: string, description: "Store immediately — never shown again" }
 *                 apiKey:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     label: { type: string }
 *                     scopes: { type: array, items: { type: string } }
 *                     expiresAt: { type: string, format: date-time, nullable: true }
 *                     isActive: { type: boolean }
 *                     createdAt: { type: string, format: date-time }
 *       401:
 *         description: Not authenticated
 */
apiKeyRoutes.post('/', validateBody(CreateApiKeySchema), async (req, res) => {
  await new ApiKeyController().create(req, res);
});

/**
 * @swagger
 * /api-keys:
 *   get:
 *     summary: List all API keys for the authenticated user
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of keys (keyHash never returned)
 *       401:
 *         description: Not authenticated
 */
apiKeyRoutes.get('/', async (req, res) => {
  await new ApiKeyController().list(req, res);
});

/**
 * @swagger
 * /api-keys/{id}:
 *   delete:
 *     summary: Revoke (deactivate) an API key
 *     tags: [API Keys]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Key revoked
 *       403:
 *         description: Not your key
 *       404:
 *         description: Key not found
 */
apiKeyRoutes.delete('/:id', async (req, res) => {
  await new ApiKeyController().revoke(req, res);
});
