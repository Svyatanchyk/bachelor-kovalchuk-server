import { authenticateToken } from "./../../middlewares/authentificateToken";
import { Router } from "express";
import OpenAiController from "../../controllers/OpenAiController";

const router = Router();

router.post("/generate-text", authenticateToken, OpenAiController.generateText);

export { router };
