import express, { Application, Request, Response } from "express";
import connectDB from "./config/db";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes/router";
import cookieParser from "cookie-parser";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.FRONTEND_BASE_URL;

app.use(cookieParser());
app.use(express.json());
const corsOptions = {
  origin: "*", // Allow all origins
  credentials: true, // Allow cookies and authentication headers if needed
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
};

app.use(cors(corsOptions));

app.use(router);

const start = async () => {
  await connectDB();

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
