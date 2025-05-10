import { RequestHandler, Router } from "express";
import CreativeController from "../../controllers/CreativeController";
import { authenticateToken } from "../../middlewares/authentificateToken";

const router = Router();

router.post(
  "/save",
  authenticateToken,
  CreativeController.saveCreatives as RequestHandler
);

router.get(
  "",
  authenticateToken,
  CreativeController.getCreatives as RequestHandler
);

export { router };
