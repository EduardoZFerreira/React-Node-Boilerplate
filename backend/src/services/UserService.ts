import crypto from 'crypto';
import { compare, genSalt, hash } from 'bcrypt';
import prismaClient from '../prisma/prismaClient';
import { CreateUserResponseDTO } from '../DTOs/CreateUserResponseDTO';
import { PUBLIC_EMAIL_DOMAINS } from '../config/publicEmailDomains';
import { Role } from '../config/roles';
import { AppError } from '../errors/AppError';
import { EmailService } from './EmailService';
import { CreateUserInput, LoginInput } from '../schemas/userSchema';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

function isUniqueConstraintError(err: unknown): boolean {
  return Boolean(err) && (err as NodeJS.ErrnoException & { code?: string }).code === 'P2002';
}

// "acme.com" -> "acme-com" — matches the slug format required by CreateTenantSchema.
function slugifyDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

class UserService {
  async getEmailInUse(email: string): Promise<boolean> {
    const user = await prismaClient.user.findFirst({
      where: { email },
      select: { id: true },
    });
    return Boolean(user);
  }

  async createUser(userData: CreateUserInput): Promise<CreateUserResponseDTO> {
    const userExists = await this.getEmailInUse(userData.email);
    if (userExists) return new CreateUserResponseDTO(true, ['E-mail already in use']);

    const salt = await genSalt();
    const passwordHash = await hash(userData.password, salt);
    const domain = userData.email.split('@')[1]?.toLowerCase();

    // Company domains (i.e. not a shared personal-email provider) auto-create
    // their tenant on first signup, and that registrant becomes its TenantManager.
    // A later signup from the same domain is routed to "contact your manager"
    // instead of creating a duplicate organization.
    if (domain && !PUBLIC_EMAIL_DOMAINS.has(domain)) {
      try {
        const newUser = await prismaClient.$transaction(async (tx) => {
          const tenant = await tx.tenant.create({
            data: { name: domain, slug: slugifyDomain(domain), domain },
          });

          return tx.user.create({
            data: {
              name: userData.name,
              surname: userData.surname,
              email: userData.email,
              password: passwordHash,
              roles: [Role.USER, Role.TENANT_MANAGER],
              tenantId: tenant.id,
            },
          });
        });

        return new CreateUserResponseDTO(false, [], newUser.id);
      } catch (err) {
        if (isUniqueConstraintError(err)) {
          return new CreateUserResponseDTO(true, [
            "An organization is already registered for this email domain. Contact your organization's manager for access.",
          ]);
        }
        throw err;
      }
    }

    const newUser = await prismaClient.user.create({
      data: {
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        password: passwordHash,
        roles: [Role.USER],
      },
    });

    return new CreateUserResponseDTO(false, [], newUser.id);
  }

  async addUserRole(userId: string, role: Role): Promise<void> {
    const user = await prismaClient.user.findFirst({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User does not exist');

    if (!user.roles.includes(role)) {
      await prismaClient.user.update({
        where: { id: userId },
        data: { roles: { push: role } },
      });
    }
  }

  async removeUserRole(userId: string, role: Role): Promise<void> {
    const user = await prismaClient.user.findFirst({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User does not exist');

    await prismaClient.user.update({
      where: { id: userId },
      data: { roles: user.roles.filter((r) => r !== role) },
    });
  }

  async login(credentials: LoginInput): Promise<{
    id: string;
    email: string;
    roles: string[];
    tenantId: string | null;
    mustResetPassword: boolean;
  }> {
    const user = await prismaClient.user.findFirst({
      where: { email: credentials.email },
    });

    if (!user) throw new AppError(401, 'Invalid credentials');

    const passwordMatch = await compare(credentials.password, user.password);
    if (!passwordMatch) throw new AppError(401, 'Invalid credentials');

    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      tenantId: user.tenantId,
      mustResetPassword: user.mustResetPassword,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prismaClient.user.findFirst({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const currentMatches = await compare(currentPassword, user.password);
    if (!currentMatches) throw new AppError(401, 'Current password is incorrect');

    const salt = await genSalt();
    const passwordHash = await hash(newPassword, salt);

    await prismaClient.user.update({
      where: { id: userId },
      data: { password: passwordHash, mustResetPassword: false },
    });
  }

  // Always succeeds from the caller's perspective, whether or not the email
  // exists — the controller responds with the same generic message either way
  // to avoid leaking which emails are registered.
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prismaClient.user.findFirst({ where: { email } });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');

    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: hashToken(rawToken),
        resetPasswordExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await EmailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prismaClient.user.findFirst({
      where: {
        resetPasswordTokenHash: hashToken(token),
        resetPasswordExpiresAt: { gt: new Date() },
      },
    });
    if (!user) throw new AppError(400, 'Invalid or expired reset link');

    const salt = await genSalt();
    const passwordHash = await hash(newPassword, salt);

    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        mustResetPassword: false,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
    });
  }

  async listUsersInTenant(tenantId: string, page: number, limit: number) {
    const [users, total] = await Promise.all([
      prismaClient.user.findMany({
        where: { tenantId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          roles: true,
          tenantId: true,
          createdAt: true,
        },
      }),
      prismaClient.user.count({ where: { tenantId } }),
    ]);

    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  async createUserInTenant(data: CreateUserInput, tenantId: string): Promise<CreateUserResponseDTO> {
    const userExists = await this.getEmailInUse(data.email);
    if (userExists) return new CreateUserResponseDTO(true, ['E-mail already in use']);

    const salt = await genSalt();
    const passwordHash = await hash(data.password, salt);

    const newUser = await prismaClient.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: passwordHash,
        roles: [Role.USER],
        tenantId,
      },
    });

    return new CreateUserResponseDTO(false, [], newUser.id);
  }
}

export { UserService };
