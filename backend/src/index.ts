import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.listen(Number(process.env.API_PORT) ?? 8081, () => {
  console.log("server online");
});
