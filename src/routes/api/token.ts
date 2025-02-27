import { Router } from "express";

import TokenController from "../../controllers/TokenController";
const router = Router();

router.post("/token", TokenController.refresh);

export { router };
