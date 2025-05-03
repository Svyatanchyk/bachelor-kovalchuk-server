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
const allowedOrigins = [
  "https://generise.netlify.app",
  "http://localhost:5173",
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin!) || !origin) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error("Not allowed by CORS")); // Block the request
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use(router);

const start = async () => {
  await connectDB();

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
