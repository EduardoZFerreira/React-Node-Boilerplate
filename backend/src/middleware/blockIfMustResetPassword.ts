import { Request, Response, NextFunction } from 'express';

// Reads straight from the session cookie, not req.authUser — this runs
// regardless of whether requireSession/requireAuth has resolved yet, and API
// key requests never carry this flag, so nothing extra is needed to exempt them.
function blockIfMustResetPassword(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.mustResetPassword) {
    res.status(403).json({ hasError: true, errors: ['Password reset required'] });
    return;
  }

  next();
}

export { blockIfMustResetPassword };
