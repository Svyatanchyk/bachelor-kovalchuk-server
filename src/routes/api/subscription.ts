import SubscriptionController from "../../controllers/SubscriptionController";
import { authenticateToken } from "../../middlewares/authentificateToken";
import { RequestHandler, Router } from "express";

const router = Router();

router.post(
  "/create",
  authenticateToken,
  SubscriptionController.createSubscription as RequestHandler
);

router.post(
  "/monobank-webhook",
  SubscriptionController.subscriptionWebhook as RequestHandler
);

export { router };
