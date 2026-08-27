import Jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SessionUser } from './SessionService';

// Issues SHORT-LIVED tokens for microservice calls ONLY — never for browser sessions.
// Both JWT laws must be respected: (1) single-purpose scope, (2) short expiration (≤ 5 min).

class JwtService {
  private static readonly ALGORITHM = 'HS256' as const;
  private static readonly EXPIRY = '5m';

  private static getSecret(): string {
    const secret = process.env.JWT_SERVICE_SECRET;
    if (!secret) throw new Error('JWT_SERVICE_SECRET is not configured');
    return secret;
  }

  static issueServiceToken(user: SessionUser, audience: string, scope: string): string {
    return Jwt.sign(
      { sub: String(user.id), roles: user.roles, scope },
      JwtService.getSecret(),
      {
        algorithm: JwtService.ALGORITHM,
        expiresIn: JwtService.EXPIRY,
        audience,
        issuer: process.env.JWT_ISSUER ?? 'boilerplate-api',
        jwtid: crypto.randomUUID(),
      }
    );
  }

  static verifyServiceToken(token: string, audience: string): Jwt.JwtPayload {
    return Jwt.verify(token, JwtService.getSecret(), {
      algorithms: [JwtService.ALGORITHM],
      audience,
      issuer: process.env.JWT_ISSUER ?? 'boilerplate-api',
    }) as Jwt.JwtPayload;
  }
}

export { JwtService };
