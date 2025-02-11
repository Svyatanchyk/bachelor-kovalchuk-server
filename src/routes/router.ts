import express from "express";
import { router as userRouter } from "./api/user";
import { router as creativeRouter } from "./api/creative";

const router = express.Router();

router.use("/user", userRouter);
router.use("/gpt", creativeRouter);

export { router };
