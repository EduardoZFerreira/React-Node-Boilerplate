import { Request, Response, Router } from "express";
import { UserController } from "../controllers/UserController";

export const publicRoutes = Router();

publicRoutes.route("/healthcheck").get((req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

publicRoutes.route("/user").post(async (req: Request, res: Response) => {
  await new UserController().createUser(req, res);
});
