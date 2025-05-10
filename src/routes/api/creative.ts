import { RequestHandler, Router } from "express";
import CreativeController from "../../controllers/CreativeController";
import { authenticateToken } from "../../middlewares/authentificateToken";

const router = Router();

router.post(
  "/save",
  authenticateToken,
  CreativeController.saveCreatives as RequestHandler
);

export { router };
