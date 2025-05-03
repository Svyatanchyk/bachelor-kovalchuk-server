import express, { Application, Request, Response } from "express";
import connectDB from "./config/db";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import { router } from "./routes/router";
import cookieParser from "cookie-parser";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.FRONTEND_BASE_URL;

app.use(cookieParser());
app.use(express.json());
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "https://generise.netlify.app",
    ];

    if (allowedOrigins.includes(origin!) || !origin) {
      // Allow requests from allowed origins or if no origin is provided (e.g., for local testing)
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow credentials (cookies, HTTP authentication)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
};

// Apply the CORS configuration
app.use(cors(corsOptions));

app.use(router);

const start = async () => {
  await connectDB();

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
