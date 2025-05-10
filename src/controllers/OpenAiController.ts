import { Response, Request } from "express";
import { openAi } from "../config/openai";
import dotenv from "dotenv";
import { generatePrompt } from "../utils/generatePrompt";
import User from "../models/User";
dotenv.config();

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

class OpenAiController {
  generateText = async (req: AuthRequest, res: Response) => {
    try {
      const { country, language, nText, vertical, price } = req.body;

      if (!country || !language || !nText || !vertical) {
        res.status(400).json({
          status: "FAILED",
          message: "All parameters should be passed",
        });
        return;
      }

      const isUser = await User.findById(req.user?.userId);

      if (!isUser) {
        res.status(401).json({
          status: "FAILED",
          message: "Unauthorized",
        });
        return;
      }

      if (isUser.tokenBalance < price) {
        res.status(403).json({
          status: "FAILED",
          message: "Forbidden: insufficient token balance",
        });
        return;
      }

      const prompt = generatePrompt(nText, vertical, country, language);

      const thread = await openAi.beta.threads.create();

      await openAi.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt,
      });

      const run = await openAi.beta.threads.runs.create(thread.id, {
        assistant_id: process.env.ASSISTANT_ID!,
      });

      let runStatus;

      do {
        runStatus = await openAi.beta.threads.runs.retrieve(thread.id, run.id);
      } while (runStatus.status !== "completed");

      const messages = await openAi.beta.threads.messages.list(thread.id);
      const assistantResponse = messages.data[0].content[0];

      if (assistantResponse?.type !== "text") {
        throw new Error("Unexpected response format from assistant.");
      }

      console.log("Assistant Response:", messages.data[0].content[0]);

      const parsedValue = JSON.parse(assistantResponse.text.value);

      const user = await User.findById(req.user?.userId);

      if (!user) {
        res.status(401).json({
          status: "FAILED",
          message: "User not found",
        });
        return;
      }

      const updatedUser = await User.findOneAndUpdate(
        {
          _id: req.user?.userId,
          tokenBalance: { $gte: price },
        },
        {
          $inc: { tokenBalance: -price },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(403).json({
          status: "FAILED",
          message: "Forbidden: insufficient token balance",
        });
      }

      res.status(200).json({
        status: "SUCCESS",
        text: parsedValue,
        tokenBalance: updatedUser?.tokenBalance,
      });
    } catch (error) {
      res.status(500).json({
        status: "FAILED",
      });
      console.error("Error:", error);
    }
  };
}

export default new OpenAiController();
