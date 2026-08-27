import prismaClient from '../prisma/prismaClient';
import { AppError } from '../errors/AppError';
import { CreateTenantInput, UpdateTenantInput } from '../schemas/tenantSchema';

class TenantService {
  async create(data: CreateTenantInput) {
    const exists = await prismaClient.tenant.findFirst({ where: { slug: data.slug } });
    if (exists) throw new AppError(409, `Slug '${data.slug}' is already in use`);

    return prismaClient.tenant.create({ data });
  }

  async list(page: number, limit: number) {
    const [tenants, total] = await Promise.all([
      prismaClient.tenant.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prismaClient.tenant.count(),
    ]);

    return { tenants, total, page, pages: Math.ceil(total / limit) };
  }

  async getBySlug(slug: string) {
    const tenant = await prismaClient.tenant.findFirst({ where: { slug } });
    if (!tenant) throw new AppError(404, `Tenant '${slug}' not found`);
    return tenant;
  }

  async getById(id: string) {
    const tenant = await prismaClient.tenant.findFirst({ where: { id } });
    if (!tenant) throw new AppError(404, 'Tenant not found');
    return tenant;
  }

  async update(id: string, data: UpdateTenantInput) {
    await this.getById(id);
    return prismaClient.tenant.update({ where: { id }, data });
  }
}

export { TenantService };
