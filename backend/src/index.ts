import express from "express";
import dotenv from "dotenv";
import { publicRoutes } from "./routes/publicRoutes";

dotenv.config();

const app = express();

app.use(publicRoutes);

app.listen(Number(process.env.API_PORT) ?? 8081, () => {
  console.log("server online");
});
