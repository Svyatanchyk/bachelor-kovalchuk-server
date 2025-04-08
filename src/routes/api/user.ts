import { Router } from "express";
import UserController from "../../controllers/UserController";
import { validateSignup } from "../../middlewares/validation";
import { authenticateToken } from "../../middlewares/authentificateToken";

const router = Router();

router.post("/signup", validateSignup, UserController.signup);
router.post("/signin", UserController.signin);
router.post("/verify/:userId/:uniqueString", UserController.verifySignup);
router.post(
  "/regenerate/verification/:userId",
  UserController.regenerateVerificationLink
);
router.post("/request-reset-password", UserController.requestResetPassword);
router.post("/reset-password", UserController.resetPassword);
router.get("/auth/me", authenticateToken, UserController.authMe);

export { router };
