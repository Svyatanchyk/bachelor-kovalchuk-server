import { authenticateToken } from "../../middlewares/authentificateToken";
import { RequestHandler, Router } from "express";
import OpenAiController from "../../controllers/OpenAiController";

const router = Router();

router.post(
  "/generate-text",
  authenticateToken,
  OpenAiController.generateText as RequestHandler
);

export { router };
