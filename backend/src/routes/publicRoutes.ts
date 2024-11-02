import { Request, Response, Router } from "express";

export const publicRoutes = Router();

publicRoutes.route("/healthcheck").get((req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});
