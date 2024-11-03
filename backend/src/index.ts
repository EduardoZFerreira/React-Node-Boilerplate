import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { publicRoutes } from "./routes/publicRoutes";
import { corsOptions } from "./config/corsOptions";
import bodyParser from "body-parser";
import { RoleService } from "./services/RoleService";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(publicRoutes);

app.listen(Number(process.env.API_PORT) ?? 8081, () => {
  RoleService.verifyRoles();
  console.log("server online");
});
