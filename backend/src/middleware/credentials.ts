import { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const allowedOrigins = process?.env?.ALLOWED_ORIGINS?.split(" ");

const credentials = (req: Request, res: Response, next: any) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins?.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", "true");
  }

  next();
};

export { credentials };
