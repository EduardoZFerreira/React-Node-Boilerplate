import { Request, Response } from 'express';
import { ItemService } from '../services/ItemService';
import { Role } from '../config/roles';
import { PaginationSchema } from '../schemas/itemSchema';

class ItemController {
  async list(req: Request, res: Response): Promise<void> {
    const { page, limit } = PaginationSchema.parse(req.query);
    const isAdmin =
      req.authUser!.roles.includes(Role.ADMIN) || req.authUser!.scopes.includes('admin');

    const result = await new ItemService().list(page, limit, {
      tenantId: req.tenant?.id,
      includeInactive: isAdmin,
    });

    res.status(200).json({ hasError: false, errors: [], ...result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const item = await new ItemService().getById(req.params.id);
    res.status(200).json({ hasError: false, errors: [], item });
  }

  async create(req: Request, res: Response): Promise<void> {
    const item = await new ItemService().create(req.body, req.authUser!.id, req.tenant?.id);
    res.status(201).json({ hasError: false, errors: [], item });
  }

  async update(req: Request, res: Response): Promise<void> {
    const isAdmin =
      req.authUser!.roles.includes(Role.ADMIN) || req.authUser!.scopes.includes('admin');
    const item = await new ItemService().update(
      req.params.id,
      req.body,
      req.authUser!.id,
      isAdmin,
    );
    res.status(200).json({ hasError: false, errors: [], item });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const isAdmin =
      req.authUser!.roles.includes(Role.ADMIN) || req.authUser!.scopes.includes('admin');
    await new ItemService().delete(req.params.id, req.authUser!.id, isAdmin);
    res.sendStatus(204);
  }
}

export { ItemController };
