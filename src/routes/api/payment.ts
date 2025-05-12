import { authenticateToken } from "../../middlewares/authentificateToken";
import { RequestHandler, Router } from "express";
import PaymentController from "../../controllers/PaymentController";

const router = Router();

router.post(
  "/create-invoice",
  authenticateToken,
  PaymentController.createInvoice as RequestHandler
);

export { router };
