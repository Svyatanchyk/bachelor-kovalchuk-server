import { Response, Request } from "express";
import { openAi } from "../config/openai";
import dotenv from "dotenv";
dotenv.config();

class OpenAiController {
  generateText = async (req: Request, res: Response) => {
    const { country, language, nText, vertical } = req.body;

    const userMessage = `Generate ${nText} short variations of text for a minimalist creative in the field of ${vertical}, targeting an audience in ${country}. Use the following languages ${language}. The content should be 10-15 words long with a call to action. Do not include the country name in the text. The response should be a valid JSON object in the following format: {"1": "", ...} without code block`;

    try {
      const thread = await openAi.beta.threads.create();

      await openAi.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMessage,
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
