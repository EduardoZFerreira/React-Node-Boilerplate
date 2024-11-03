import { Request, Response, Router } from "express";
import { UserController } from "../controllers/UserController";

export const publicRoutes = Router();

publicRoutes.route("/healthcheck").get((req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

publicRoutes.route("/user").post(async (req: Request, res: Response) => {
  await new UserController().createUser(req, res);
});

publicRoutes.route("/login").post(async (req: Request, res: Response) => {
  await new UserController().login(req, res);
});

publicRoutes.route("/logout").get(async (req: Request, res: Response) => {
  await new UserController().logout(req, res);
});
