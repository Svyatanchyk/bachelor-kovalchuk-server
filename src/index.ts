import express, { Application, Request, Response } from "express";
import connectDB from "./config/db";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes/router";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(router);

const start = async () => {
  await connectDB();

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
