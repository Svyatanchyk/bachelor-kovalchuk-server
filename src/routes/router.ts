import express from "express";
import { router as userRouter } from "./api/user";
import { router as creativeRouter } from "./api/creative";
import { router as refreshToken } from "./api/token";
import { router as googleAuthRouter } from "./api/googleAuth";

const router = express.Router();

router.use("/user", userRouter);
router.use("/gpt", creativeRouter);
router.use("/refresh", refreshToken);
router.use("/api/auth", googleAuthRouter);

export { router };
