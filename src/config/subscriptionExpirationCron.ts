import { Subscription } from "./../models/Subscription";
import cron from "node-cron";

cron.schedule("0 0 * * *", async () => {
  const now = new Date();

  const result = await Subscription.updateMany(
    { endDate: { $lt: now }, status: "active" },
    { status: "expired" }
  );

  console.log(`✅ Expired ${result.modifiedCount} subscriptions`);
});
