import prismaClient from '../prisma/prismaClient';
import { AppError } from '../errors/AppError';
import { CreateItemInput, UpdateItemInput } from '../schemas/itemSchema';

class ItemService {
  async list(page: number, limit: number, options: { tenantId?: string; includeInactive?: boolean } = {}) {
    const where = {
      ...(options.tenantId !== undefined && { tenantId: options.tenantId }),
      ...(!options.includeInactive && { isActive: true }),
    };

    const [items, total] = await Promise.all([
      prismaClient.item.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          isActive: true,
          tenantId: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prismaClient.item.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const item = await prismaClient.item.findFirst({ where: { id } });
    if (!item) throw new AppError(404, 'Item not found');
    return item;
  }

  async create(data: CreateItemInput, createdById: string, tenantId?: string) {
    return prismaClient.item.create({
      data: {
        title: data.title,
        description: data.description,
        createdById,
        tenantId: tenantId ?? null,
      },
    });
  }

  async update(id: string, data: UpdateItemInput, requesterId: string, isAdmin: boolean) {
    const item = await this.getById(id);

    if (!isAdmin && item.createdById !== requesterId) {
      throw new AppError(403, 'You can only update your own items');
    }

    return prismaClient.item.update({ where: { id }, data });
  }

  async delete(id: string, requesterId: string, isAdmin: boolean) {
    const item = await this.getById(id);

    if (!isAdmin && item.createdById !== requesterId) {
      throw new AppError(403, 'You can only delete your own items');
    }

    await prismaClient.item.delete({ where: { id } });
  }
}

export { ItemService };
