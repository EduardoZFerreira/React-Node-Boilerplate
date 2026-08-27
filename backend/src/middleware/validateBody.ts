import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodIssue } from 'zod';

function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        hasError: true,
        errors: result.error.issues.map((issue: ZodIssue) => issue.message),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        hasError: true,
        errors: result.error.issues.map((issue: ZodIssue) => issue.message),
      });
      return;
    }

    next();
  };
}

export { validateBody, validateQuery };
