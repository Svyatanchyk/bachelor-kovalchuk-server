import { Request, Response } from "express";
import Creative from "../models/Creatives";
import { v4 as uuidv4 } from "uuid";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

class CreativeController {
  saveCreatives = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      let { creatives } = req.body;

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

      creatives = creatives.map((crt) => ({
        id: uuidv4(),
        ...crt,
      }));

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

  deleteCreative = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { creativeId } = req.params;

      if (!userId) {
        res.status(401).json({ error: "User is not authenticated" });
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

      const result = await Creative.updateOne(
        { userId: userId },
        { $pull: { creatives: { id: creativeId } } }
      );

      if (result.modifiedCount > 0) {
        res.status(200).json({
          status: "SUCCESS",
          message: "Creatives deleted successfully",
        });
      } else {
        res.status(404).json({
          status: "FAILED",
          message: "Creative not found",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Error deleting creative");
    }
  };
}

export default new CreativeController();
