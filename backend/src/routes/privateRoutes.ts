import { Router, Request, Response } from "express";
import { UserController } from "../controllers/UserController";

export const privateRoutes = Router();

privateRoutes.route("/logout").get(async (req: Request, res: Response) => {
  await new UserController().logout(req, res);
});
