import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';

function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({ hasError: true, errors: [err.message] });
    return;
  }

  // Prisma unique constraint violation
  if ((err as NodeJS.ErrnoException & { code?: string }).code === 'P2002') {
    res.status(409).json({ hasError: true, errors: ['Resource already exists'] });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  res.status(500).json({
    hasError: true,
    errors:
      process.env.NODE_ENV === 'production' ? ['Internal server error'] : [err.message],
  });
}

export { errorHandler };
