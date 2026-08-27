import rateLimit from 'express-rate-limit';

const rateLimitResponse = (errors: string[]) => ({ hasError: true, errors });

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(['Too many requests, please try again in 15 minutes']),
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(['Too many requests, please try again later']),
});
