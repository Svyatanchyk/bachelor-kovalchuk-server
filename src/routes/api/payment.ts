import { authenticateToken } from "../../middlewares/authentificateToken";
import { RequestHandler, Router } from "express";
import PaymentController from "../../controllers/PaymentController";

const router = Router();

router.post(
  "/create-invoice",
  authenticateToken,
  PaymentController.createPayment as RequestHandler
);

router.post("/monobank-webhook", PaymentController.webhook as RequestHandler);

export { router };
