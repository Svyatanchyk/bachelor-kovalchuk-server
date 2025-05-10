import { Request, Response } from "express";
import Creative from "../models/Creatives";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

class CreativeController {
  saveCreatives = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { creatives } = req.body;

      console.log(" Creatives: ", creatives);

      if (!userId) {
        res.status(400).json({ error: "User not authenticated" });
        return;
      }

      if (!creatives || !Array.isArray(creatives)) {
        res
          .status(400)
          .json({ error: "Creatives data is required and should be an array" });
        return;
      }

      let creativeEntity = await Creative.findOne({ userId });

      if (!creativeEntity) {
        const newCreativeEntity = new Creative({
          userId,
          creatives,
        });

        await newCreativeEntity.save();
        res.status(201).json({
          status: "CREATIVE_CREATED",
          message: "New creative entity created",
        });
        return;
      }

      creativeEntity.creatives.push(...creatives);
      await creativeEntity.save();

      res
        .status(200)
        .json({ status: "SUCCESS", message: "Creatives updated successfully" });
    } catch (error) {
      console.error("Error saving creatives:", error);
      res
        .status(500)
        .json({ error: "An error occurred while saving creatives" });
    }
  };

  getCreatives = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(400).json({ error: "User not authenticated" });
        return;
      }

      const creativeEntity = await Creative.findOne({ userId });

      if (!creativeEntity) {
        res.status(400).json({
          status: "FAILED",
          message: "Creatives not found",
        });
        return;
      }

      res.status(200).json({
        status: "SUCCESS",
        message: "Creatives fetched successfully",
        creatives: creativeEntity.creatives,
      });
    } catch (error) {
      console.error("Error fetching creatives:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching creatives" });
    }
  };
}

export default new CreativeController();
