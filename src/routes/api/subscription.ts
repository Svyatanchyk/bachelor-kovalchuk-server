import SubscriptionController from "../../controllers/SubscriptionController";
import { authenticateToken } from "../../middlewares/authentificateToken";
import { RequestHandler, Router } from "express";
import "../../config/subscriptionExpirationCron";

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

router.get(
  "",
  authenticateToken,
  SubscriptionController.getUserSubscription as RequestHandler
);

router.delete(
  "/cancel",
  authenticateToken,
  SubscriptionController.cancelSubscription as RequestHandler
);

export { router };
