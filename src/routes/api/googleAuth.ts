import { Router } from "express";

import GoogleAuthController from "../../controllers/GoogleAuthController";

const router = Router();

router.post("/google/token", GoogleAuthController.auth);

export { router };
