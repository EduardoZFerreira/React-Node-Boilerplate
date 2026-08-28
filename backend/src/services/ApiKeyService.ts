import crypto from 'crypto';
import prismaClient from '../prisma/prismaClient';
import { AppError } from '../errors/AppError';
import { Role } from '../config/roles';
import { CreateApiKeyInput } from '../schemas/apiKeySchema';

// SHA-256 is appropriate for API keys: they are already high-entropy random strings.
// bcrypt is designed for low-entropy inputs (passwords) — overkill and slow here.
const hashKey = (rawKey: string): string =>
  crypto.createHash('sha256').update(rawKey).digest('hex');

const generateRawKey = (): string =>
  `bk_${crypto.randomBytes(32).toString('hex')}`;

class ApiKeyService {
  async create(userId: string, data: CreateApiKeyInput, requesterRoles: string[]) {
    // The 'admin' scope lets a key bypass item-ownership checks and see inactive
    // items (see ItemController) — only Admins may mint a key with that scope,
    // otherwise any authenticated user could self-escalate via their own API key.
    if (data.scopes.includes('admin') && !requesterRoles.includes(Role.ADMIN)) {
      throw new AppError(403, 'Only Admins can create API keys with the admin scope');
    }

    const rawKey = generateRawKey();
    const keyHash = hashKey(rawKey);

    const apiKey = await prismaClient.apiKey.create({
      data: {
        userId,
        label: data.label,
        keyHash,
        scopes: data.scopes as string[],
        expiresAt: data.expiresAt ?? null,
      },
      select: {
        id: true,
        label: true,
        scopes: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    // rawKey is returned ONLY here — never stored, never retrievable again
    return { apiKey, rawKey };
  }

  async listByUser(userId: string) {
    return prismaClient.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        label: true,
        scopes: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        // keyHash is NEVER returned to clients
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string, userId: string) {
    const key = await prismaClient.apiKey.findFirst({ where: { id } });
    if (!key) throw new AppError(404, 'API key not found');
    if (key.userId !== userId) throw new AppError(403, 'Cannot revoke another user\'s API key');

    await prismaClient.apiKey.update({ where: { id }, data: { isActive: false } });
  }

  async verify(rawKey: string, requiredScope?: string) {
    const keyHash = hashKey(rawKey);

    const record = await prismaClient.apiKey.findFirst({
      where: {
        keyHash,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: { select: { id: true, email: true, roles: true } },
      },
    });

    if (!record) return null;
    if (requiredScope && !record.scopes.includes(requiredScope)) return null;

    return {
      userId: record.user.id,
      email: record.user.email,
      roles: record.user.roles,
      scopes: record.scopes,
    };
  }
}

export { ApiKeyService };
