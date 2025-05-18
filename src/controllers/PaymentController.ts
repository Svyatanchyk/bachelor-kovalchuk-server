import { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const PRICE_PER_CREDIT = 0.012;

class PaymentController {
  createPayment = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const { amount } = req.body;

    if (!amount) {
      res.status(400).json({
        status: "FAILED",
        message: "Amount is required",
      });
      return;
    }

    const creditsPrice = Math.floor(
      PRICE_PER_CREDIT * Number(amount) * 100
    ).toFixed(2);

    try {
      const response = await axios.post(
        "https://api.monobank.ua/api/merchant/invoice/create",
        {
          amount: Number(creditsPrice),
          ccy: 840,
          redirectUrl: process.env.FRONTEND_BASE_URL,
          webhookUrl: `${process.env.SERVER_BASE_URL}/payment/monobank-webhook`,
          merchantPaymInfo: {
            reference: `TOPUP_${userId}_${Date.now()}_tokens_${amount}`,
            destination: "Поповнення кредитів",
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

      res.json({ url: response.data.pageUrl });
    } catch (error) {
      console.error("Monobank error", error);
      res.status(500).send("Payment error");
    }
  };

  webhook = async (req: AuthRequest, res: Response) => {
    const { invoiceId, status, reference } = req.body;

    if (status === "success") {
      const userId = reference.split("_")[1];
      const tokensToAdd = parseInt(reference.split("_")[4]);

      try {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { tokenBalance: tokensToAdd } },
          { new: true }
        );
        console.log(
          `✅ ${tokensToAdd} tokens added to user ${updatedUser?.email}`
        );
        res.sendStatus(200);
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
}

export default new PaymentController();
