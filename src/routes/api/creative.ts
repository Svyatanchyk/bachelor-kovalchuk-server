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

router.delete(
  "/delete/all",
  authenticateToken,
  CreativeController.deleteAllCreatives as RequestHandler
);

router.delete(
  "/delete/:creativeId",
  authenticateToken,
  CreativeController.deleteCreative as RequestHandler
);

export { router };
