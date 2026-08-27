import { Request, Response, Router } from 'express';
import { UserController } from '../controllers/UserController';
import { JwtService } from '../services/JwtService';
import { requireSession } from '../middleware/requireSession';

export const privateRoutes = Router();

privateRoutes.use(requireSession);

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user data from session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasError:
 *                   type: boolean
 *                   example: false
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
privateRoutes.get('/me', async (req: Request, res: Response) => {
  await new UserController().me(req, res);
});

/**
 * @swagger
 * /auth/service-token:
 *   post:
 *     summary: Issue a short-lived JWT for a microservice call
 *     description: >
 *       Issues a single-purpose JWT (5 min expiry) scoped to a specific audience and scope.
 *       This token must NOT be stored persistently — use it immediately for the microservice call.
 *       Both JWT laws are enforced: single-purpose scope and short expiration.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [audience, scope]
 *             properties:
 *               audience:
 *                 type: string
 *                 description: Target microservice identifier
 *                 example: inventory-service
 *               scope:
 *                 type: string
 *                 description: Specific permission for this call
 *                 example: inventory:read
 *     responses:
 *       200:
 *         description: Short-lived JWT (5 min)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasError:
 *                   type: boolean
 *                   example: false
 *                 token:
 *                   type: string
 *       401:
 *         description: Not authenticated
 */
privateRoutes.post('/auth/service-token', (req: Request, res: Response) => {
  const { audience, scope } = req.body as { audience: string; scope: string };
  const token = JwtService.issueServiceToken(req.authUser!, audience, scope);
  res.status(200).json({ hasError: false, errors: [], token });
});
