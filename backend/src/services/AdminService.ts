import prismaClient from '../prisma/prismaClient';
import { AppError } from '../errors/AppError';
import { Role } from '../config/roles';
import { UserService } from './UserService';

class AdminService {
  async listRoles() {
    return prismaClient.role.findMany({ orderBy: { title: 'asc' } });
  }

  async listUsers(page: number, limit: number) {
    const [users, total] = await Promise.all([
      prismaClient.user.findMany({
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
      prismaClient.user.count(),
    ]);

    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  async getUser(id: string) {
    const user = await prismaClient.user.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        roles: true,
        tenantId: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError(404, 'User not found');
    return user;
  }

  async addRole(userId: string, role: Role) {
    return new UserService().addUserRole(userId, role);
  }

  async removeRole(userId: string, role: Role) {
    return new UserService().removeUserRole(userId, role);
  }

  async assignTenant(userId: string, tenantId: string) {
    const user = await prismaClient.user.findFirst({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const tenant = await prismaClient.tenant.findFirst({ where: { id: tenantId } });
    if (!tenant) throw new AppError(404, 'Tenant not found');

    return prismaClient.user.update({
      where: { id: userId },
      data: { tenantId },
      select: { id: true, name: true, surname: true, email: true, roles: true, tenantId: true },
    });
  }
}

export { AdminService };
