import { Router } from "express";
import UserController from "../../controllers/UserController";
import { validateSignup } from "../../middlewares/validation";

const router = Router();

router.post("/signup", validateSignup, UserController.signup);
router.post("/signin", UserController.signin);
router.get("/verify/:userId/:uniqueString", UserController.verifySignup);
router.post("/verify/account", UserController.regenerateVerificationLink);
router.post("/request-reset-password", UserController.requestResetPassword);
router.post("/reset-password", UserController.resetPassword);

export { router };
