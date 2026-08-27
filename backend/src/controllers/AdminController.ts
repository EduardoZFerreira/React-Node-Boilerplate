import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { TenantService } from '../services/TenantService';
import { Role } from '../config/roles';
import { PaginationSchema } from '../schemas/itemSchema';

class AdminController {
  // --- Roles ---

  async listRoles(_req: Request, res: Response): Promise<void> {
    const roles = await new AdminService().listRoles();
    res.status(200).json({ hasError: false, errors: [], roles });
  }

  // --- Users ---

  async listUsers(req: Request, res: Response): Promise<void> {
    const { page, limit } = PaginationSchema.parse(req.query);
    const result = await new AdminService().listUsers(page, limit);
    res.status(200).json({ hasError: false, errors: [], ...result });
  }

  async getUser(req: Request, res: Response): Promise<void> {
    const user = await new AdminService().getUser(req.params.id);
    res.status(200).json({ hasError: false, errors: [], user });
  }

  async addRole(req: Request, res: Response): Promise<void> {
    const user = await new AdminService().addRole(req.params.id, req.body.role as Role);
    res.status(200).json({ hasError: false, errors: [], user });
  }

  async removeRole(req: Request, res: Response): Promise<void> {
    const user = await new AdminService().removeRole(req.params.id, req.params.role as Role);
    res.status(200).json({ hasError: false, errors: [], user });
  }

  async assignTenant(req: Request, res: Response): Promise<void> {
    const user = await new AdminService().assignTenant(req.params.id, req.body.tenantId);
    res.status(200).json({ hasError: false, errors: [], user });
  }

  // --- Tenants ---

  async createTenant(req: Request, res: Response): Promise<void> {
    const tenant = await new TenantService().create(req.body);
    res.status(201).json({ hasError: false, errors: [], tenant });
  }

  async listTenants(req: Request, res: Response): Promise<void> {
    const { page, limit } = PaginationSchema.parse(req.query);
    const result = await new TenantService().list(page, limit);
    res.status(200).json({ hasError: false, errors: [], ...result });
  }

  async updateTenant(req: Request, res: Response): Promise<void> {
    const tenant = await new TenantService().update(req.params.id, req.body);
    res.status(200).json({ hasError: false, errors: [], tenant });
  }
}

export { AdminController };
