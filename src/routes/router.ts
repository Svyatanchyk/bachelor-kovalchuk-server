import express from "express";
import { router as userRouter } from "./api/user";
import { router as gptRouter } from "./api/gpt";
import { router as refreshToken } from "./api/token";
import { router as googleAuthRouter } from "./api/googleAuth";
import { router as creativeRouter } from "./api/creative";
import { router as paymentRouter } from "./api/payment";
import { router as subscriptionRouter } from "./api/subscription";

const router = express.Router();

router.use("/user", userRouter);
router.use("/gpt", gptRouter);
router.use("/refresh", refreshToken);
router.use("/api/auth", googleAuthRouter);
router.use("/creative", creativeRouter);
router.use("/payment", paymentRouter);
router.use("/subscription", subscriptionRouter);

export { router };
