import express from "express";
import { router as userRouter } from "./api/user";

const router = express.Router();

router.use("/user", userRouter);

export { router };
