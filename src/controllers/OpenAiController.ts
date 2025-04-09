import { Response, Request } from "express";
import { openAi } from "../config/openai";
import dotenv from "dotenv";
import { generatePrompt } from "../utils/generatePrompt";
dotenv.config();

class OpenAiController {
  generateText = async (req: Request, res: Response) => {
    const { country, language, nText, vertical } = req.body;

    if (!country || !language || !nText || !vertical) {
      res.status(400).json({
        status: "FAILED",
        message: "All parameters should be passed",
      });
      return;
    }

    const prompt = generatePrompt(nText, vertical, country, language);

    try {
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

      res.status(200).json({
        status: "SUCCESS",
        text: parsedValue,
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
