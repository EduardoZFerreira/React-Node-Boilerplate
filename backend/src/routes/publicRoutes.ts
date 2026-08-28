import { Request, Response, Router } from 'express';
import { UserController } from '../controllers/UserController';
import { validateBody } from '../middleware/validateBody';
import { authLimiter } from '../middleware/rateLimiter';
import { CreateUserSchema, LoginSchema } from '../schemas/userSchema';
import { ForgotPasswordSchema, ResetPasswordSchema } from '../schemas/authSchema';

export const publicRoutes = Router();

/**
 * @swagger
 * /healthcheck:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 */
publicRoutes.get('/healthcheck', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Register a new user
 *     description: >
 *       If the email's domain isn't a known public provider (gmail.com etc.) and no
 *       tenant is registered for it yet, a tenant is auto-created for that domain and
 *       this user becomes its TenantManager. If a tenant already exists for the
 *       domain, registration is rejected — the person should be invited by their
 *       organization's manager instead (see POST /tenant/users).
 *     tags: [Auth]
 *     security: []
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
 *                 example: João
 *               surname:
 *                 type: string
 *                 example: Silva
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 example: "Secret@123"
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error or email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 */
publicRoutes.post(
  '/user',
  authLimiter,
  validateBody(CreateUserSchema),
  async (req: Request, res: Response) => {
    await new UserController().createUser(req, res);
  }
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate and start a session
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful — httpOnly session cookie set automatically
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly session cookie (sid)
 *             schema:
 *               type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 */
publicRoutes.post(
  '/login',
  authLimiter,
  validateBody(LoginSchema),
  async (req: Request, res: Response) => {
    await new UserController().login(req, res);
  }
);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: End the current session
 *     tags: [Auth]
 *     responses:
 *       204:
 *         description: Session destroyed
 */
publicRoutes.post('/logout', async (req: Request, res: Response) => {
  await new UserController().logout(req, res);
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     description: >
 *       Always responds 200, whether or not the email is registered — this
 *       never reveals which emails exist. If it is, an email is sent with a
 *       reset link valid for 1 hour.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Generic acknowledgement
 *       429:
 *         description: Too many requests
 */
publicRoutes.post(
  '/auth/forgot-password',
  authLimiter,
  validateBody(ForgotPasswordSchema),
  async (req: Request, res: Response) => {
    await new UserController().forgotPassword(req, res);
  },
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset a password using a token from the forgot-password email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset
 *       400:
 *         description: Invalid or expired reset link
 *       429:
 *         description: Too many requests
 */
publicRoutes.post(
  '/auth/reset-password',
  authLimiter,
  validateBody(ResetPasswordSchema),
  async (req: Request, res: Response) => {
    await new UserController().resetPassword(req, res);
  },
);
