import { Request, Response } from 'express';
import { ApiKeyService } from '../services/ApiKeyService';

class ApiKeyController {
  async create(req: Request, res: Response): Promise<void> {
    const result = await new ApiKeyService().create(req.authUser!.id, req.body);
    res.status(201).json({ hasError: false, errors: [], ...result });
  }

  async list(req: Request, res: Response): Promise<void> {
    const keys = await new ApiKeyService().listByUser(req.authUser!.id);
    res.status(200).json({ hasError: false, errors: [], keys });
  }

  async revoke(req: Request, res: Response): Promise<void> {
    await new ApiKeyService().revoke(req.params.id, req.authUser!.id);
    res.sendStatus(204);
  }
}

export { ApiKeyController };
