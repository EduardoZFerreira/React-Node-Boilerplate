import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { publicRoutes } from "./routes/publicRoutes";
import { corsOptions } from "./config/corsOptions";

dotenv.config();

const app = express();

app.use(cors(corsOptions));
app.use(publicRoutes);

app.listen(Number(process.env.API_PORT) ?? 8081, () => {
  console.log("server online");
});
