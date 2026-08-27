import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/SessionService';
import { ApiKeyService } from '../services/ApiKeyService';

function extractRawKey(req: Request): string | null {
  const header = req.headers['x-api-key'];
  if (typeof header === 'string' && header) return header;

  const auth = req.headers['authorization'];
  if (auth?.startsWith('ApiKey ')) return auth.slice(7);

  return null;
}

// Authenticates via session first, then API key.
// If scope is provided, API key auth requires that scope (session users bypass scope checks).
function requireAuth(scope?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sessionUser = SessionService.getUser(req);
    if (sessionUser) {
      req.authUser = { ...sessionUser, scopes: [], authMethod: 'session' };
      next();
      return;
    }

    const rawKey = extractRawKey(req);
    if (rawKey) {
      const keyData = await new ApiKeyService().verify(rawKey, scope);
      if (keyData) {
        const { userId, ...rest } = keyData;
        req.authUser = { id: userId, ...rest, authMethod: 'apikey' };
        next();
        return;
      }
    }

    res.status(401).json({ hasError: true, errors: ['Not authenticated'] });
  };
}

export { requireAuth };
