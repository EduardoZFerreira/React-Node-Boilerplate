import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { SessionService } from '../services/SessionService';

class UserController {
  async createUser(req: Request, res: Response): Promise<void> {
    const result = await new UserService().createUser(req.body);
    res.status(result.hasError ? 400 : 201).json(result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const user = await new UserService().login(req.body);
    SessionService.populate(req, { ...user, tenantId: user.tenantId ?? undefined });
    res.status(200).json({ hasError: false, errors: [], userId: user.id });
  }

  async logout(req: Request, res: Response): Promise<void> {
    await SessionService.destroy(req);
    res.clearCookie('sid');
    res.sendStatus(204);
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = SessionService.getUser(req);
    res.status(200).json({ hasError: false, errors: [], user });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    await new UserService().changePassword(req.authUser!.id, req.body.currentPassword, req.body.newPassword);
    req.session.mustResetPassword = false;
    res.status(200).json({ hasError: false, errors: [] });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await new UserService().requestPasswordReset(req.body.email);
    res.status(200).json({ hasError: false, errors: [] });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    await new UserService().resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json({ hasError: false, errors: [] });
  }
}

export { UserController };
