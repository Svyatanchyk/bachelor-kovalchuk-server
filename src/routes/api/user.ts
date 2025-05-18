import { RequestHandler, Router } from "express";
import UserController from "../../controllers/UserController";
import { validateSignup } from "../../middlewares/validation";
import { authenticateToken } from "../../middlewares/authentificateToken";

const router = Router();

router.post("/signup", validateSignup, UserController.signup);
router.post("/signin", UserController.signin);
router.patch(
  "/update",
  authenticateToken,
  UserController.updateUser as RequestHandler
);
router.patch(
  "/changePassword",
  authenticateToken,
  UserController.changeUserPassword as RequestHandler
);
router.post("/verify/:userId/:uniqueString", UserController.verifySignup);
router.post(
  "/regenerate/verification/:userId",
  UserController.regenerateVerificationLink
);
router.post("/request-reset-password", UserController.requestResetPassword);
router.post("/reset-password", UserController.resetPassword);
router.get(
  "/auth/me",
  authenticateToken,
  UserController.authMe as RequestHandler
);
router.post(
  "/logout",
  authenticateToken,
  UserController.logout as RequestHandler
);
router.patch(
  "/withdraw-credits",
  authenticateToken,
  UserController.withdrawCredits as RequestHandler
);
router.delete(
  "/delete",
  authenticateToken,
  UserController.deleteAccount as RequestHandler
);

export { router };
