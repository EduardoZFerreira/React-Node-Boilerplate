import { Request, Response, NextFunction } from 'express';
import { Role } from '../config/roles';

function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles = req.authUser?.roles ?? [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ hasError: true, errors: ['Insufficient permissions'] });
      return;
    }

    next();
  };
}

export { requireRole };
