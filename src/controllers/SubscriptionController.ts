import axios from "axios";
import { Request, Response } from "express";
import { Subscription } from "../models/Subscription";
import User from "../models/User";
import { SUBSCRIPTIONS } from "../constants/prices";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

class SubscriptionController {
  createSubscription = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { subscriptionType } = req.body;

    if (!subscriptionType) {
      res.status(400).json({
        status: "FAILED",
        message: "Subscription type is required",
      });
      return;
    }

    const subscription = SUBSCRIPTIONS.find(
      (sub) => sub.type === subscriptionType
    );

    if (!subscription) {
      res.status(400).json({
        status: "FAILED",
        message: "Subscription type is incorect",
      });
      return;
    }

    try {
      const response = await axios.post(
        "https://api.monobank.ua/api/merchant/invoice/create",
        {
          amount: subscription?.price * 100,
          ccy: 840,
          redirectUrl: process.env.FRONTEND_BASE_URL,
          webhookUrl: `${process.env.SERVER_BASE_URL}/subscription/monobank-webhook`,
          merchantPaymInfo: {
            reference: `TOPUP_${userId}_${Date.now()}_${subscription.type}`,
            destination: "Покупка підписки",
          },
          validity: 3600,
        },
        {
          headers: {
            "X-Token": process.env.MONOBANK_TOKEN!,
            "Content-Type": "application/json",
          },
        }
      );

      res.status(200).json({ url: response.data.pageUrl });
    } catch (error) {
      console.error("Monobank error", error);
      res.status(500).send("Payment error");
    }
  };

  subscriptionWebhook = async (req: AuthRequest, res: Response) => {
    const { status, reference } = req.body;

    if (status === "success") {
      const userId = reference.split("_")[1];
      const subscriptionType = reference.split("_")[3];

      try {
        const subscription = await Subscription.findOne({ userId });

        if (!subscription) {
          const newSubscription = new Subscription({
            status: "active",
            userId,
            subType: subscriptionType,
          });

          const savedSubscription = await newSubscription.save();

          await User.findByIdAndUpdate(
            userId,
            { $inc: { tokenBalance: 500 } },
            { new: true }
          );

          res.status(200).json({
            status: "SUCCESS",
            subscriptionStatus: "active",
            subscriptionEnd: savedSubscription.endDate,
          });
          return;
        }

        const now = new Date();
        const currentEndDate = new Date(subscription.endDate);
        const newEndDate =
          currentEndDate > now
            ? new Date(currentEndDate.setMonth(currentEndDate.getMonth() + 1))
            : new Date(now.setMonth(now.getMonth() + 1));

        subscription.status = "active";
        subscription.startDate = now;
        subscription.endDate = newEndDate;

        await subscription.save();
        await User.findByIdAndUpdate(
          userId,
          { $inc: { tokenBalance: 500 } },
          { new: true }
        );

        res.status(200).send();
        return;
      } catch (error) {
        console.error("❌ Error updating user balance:", error);
        res.sendStatus(500);
      }
    }

    if (status === "processing") {
      console.log("⏳ Payment is still processing...");
      res.sendStatus(202);
      return;
    }

    if (status === "failure") {
      console.log("❌ Payment failed");
      return res.sendStatus(200);
    }
  };

  getUserSubscription = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      const user = await User.findById(userId);

      if (!user) {
        res.status(401).json({
          status: "FAILED",
          message: "Unauthorized",
        });
        return;
      }

      const userSub = await Subscription.findOne({ userId });

      if (!userSub) {
        res.status(200).json({
          status: "SUCCESS",
          subscription: null,
        });
        return;
      }

      res.status(200).json({
        status: "SUCCESS",
        subscription: userSub,
      });
    } catch (error) {
      console.error("❌ ", error);
      res.status(500).json({
        status: "FAILED",
        message: "An error occured",
      });
    }
  };

  cancelSubscription = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      console.log("UserId", userId);

      if (!userId) {
        res.status(401).json({
          status: "FAILED",
          message: "Unauthorized: Missing user ID",
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(401).json({
          status: "FAILED",
          message: "Unauthorized: User not found",
        });
        return;
      }

      const deletedSubscription = await Subscription.findOneAndDelete({
        userId,
      });

      if (!deletedSubscription) {
        res.status(404).json({
          status: "FAILED",
          message: "No active subscription to cancel",
        });
        return;
      }

      return res.status(200).json({
        status: "SUCCESS",
        message: "Subscription cancelled successfully",
      });
    } catch (error) {
      console.error("❌ Error cancelling subscription:", error);
      res.status(500).json({
        status: "FAILED",
        message: "Server error during subscription cancellation",
      });
      return;
    }
  };
}

export default new SubscriptionController();
