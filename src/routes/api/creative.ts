import { Response, Request, Router } from "express";
import OpenAiController from "../../controllers/OpenAiController";

const router = Router();

router.post("/generate-text", OpenAiController.generateText);

export { router };
