import express, { Application, Request, Response } from "express";
import connectDB from "./config/db";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import { router } from "./routes/router";
import cookieParser from "cookie-parser";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://generise.netlify.app",
    ];

    if (allowedOrigins.includes(origin!) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

// Apply the CORS configuration
app.use(cors(corsOptions));

app.use(router);

const start = async () => {
  await connectDB();

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
