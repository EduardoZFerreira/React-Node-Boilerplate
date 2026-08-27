import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/ApiKeyService';

function extractRawKey(req: Request): string | null {
  const header = req.headers['x-api-key'];
  if (typeof header === 'string' && header) return header;

  const auth = req.headers['authorization'];
  if (auth?.startsWith('ApiKey ')) return auth.slice(7);

  return null;
}

// API-key-only authentication — rejects sessions. Use on routes exposed to external callers.
function verifyApiKey(scope?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = extractRawKey(req);
    if (!rawKey) {
      res.status(401).json({ hasError: true, errors: ['API key required'] });
      return;
    }

    const keyData = await new ApiKeyService().verify(rawKey, scope);
    if (!keyData) {
      res.status(401).json({ hasError: true, errors: ['Invalid or insufficient API key'] });
      return;
    }

    const { userId, ...rest } = keyData;
    req.authUser = { id: userId, ...rest, authMethod: 'apikey' };
    next();
  };
}

export { verifyApiKey };
