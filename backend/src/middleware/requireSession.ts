import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/SessionService';

function requireSession(req: Request, res: Response, next: NextFunction): void {
  const user = SessionService.getUser(req);

  if (!user) {
    if (req.session?.userId) {
      SessionService.destroy(req).catch(() => {});
    }
    res.status(401).json({ hasError: true, errors: ['Not authenticated'] });
    return;
  }

  req.authUser = { ...user, scopes: [], authMethod: 'session' };
  next();
}

export { requireSession };
