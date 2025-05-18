import { Request, Response } from "express";
import Creative from "../models/Creatives";
import dotenv from "dotenv";
import { s3 } from "../config/s3";

dotenv.config();

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

class CreativeController {
  saveCreatives = async (req: AuthRequest, res: Response) => {
    console.log("Saving");

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

      const savedCreatives: any[] = [];

      const creativePromises = creatives.map(async (crt: any) => {
        try {
          if (!crt.image) {
            throw new Error("Creative image is required");
          }

          const creativeImageBase64 = crt.image;
          const creativeImageUrl = await this.uploadBase64ToS3(
            creativeImageBase64,
            `creativeImage-${Date.now()}`
          );
          crt.image = creativeImageUrl;

          const objectPromises = crt.objects.map(async (obj: any) => {
            if (obj.type === "Image") {
              const imageUrl = await this.uploadBase64ToS3(
                obj.src,
                `image-${Date.now()}`
              );
              obj.src = imageUrl;
            }
          });

          await Promise.all(objectPromises);

          const newCreative = new Creative({
            userId,
            creative: crt,
          });

          const savedCreative = await newCreative.save();
          savedCreatives.push(savedCreative);
        } catch (error) {
          console.error("Error saving creative:", error);
          throw new Error("Error saving a creative");
        }
      });

      await Promise.all(creativePromises);

      console.log(savedCreatives);

      res.status(200).json({
        status: "SUCCESS",
        message: "Creatives saved successfully",
        creatives: savedCreatives,
      });
    } catch (error) {
      console.error("Error saving creatives:", error);
      res
        .status(500)
        .json({ error: "An error occurred while saving creatives" });
    }
  };

  getCreatives = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: "User not authorized" });
        return;
      }

      const creatives = await Creative.find({ userId });

      if (!creatives.length) {
        res.status(200).json({
          creatives: [],
          message: "No creatives found",
          status: "SUCCESS",
        });
        return;
      }

      res.status(200).json({
        status: "SUCCESS",
        message: "Creatives fetched successfully",
        creatives,
      });
    } catch (error) {
      console.error("Error fetching creatives:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching creatives" });
    }
  };

  updateCreative = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { creativeId } = req.params;
      const { creative } = req.body;

      if (!userId) {
        res.status(401).json({ error: "User not authorized" });
        return;
      }

      const updateCreative = await Creative.findByIdAndUpdate(
        { _id: creativeId, userId },
        { creative },
        {
          new: true,
        }
      );

      if (!updateCreative) {
        res.status(400).json({
          status: "FAILED",
          message: "Creative was not found",
        });
        return;
      }

      res.status(200).json({
        status: "SUCCESS",
        creative: updateCreative,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error updading creative");
    }
  };

  deleteCreative = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { creativeId } = req.params;

      if (!userId) {
        res.status(401).json({ error: "User is not authenticated" });
        return;
      }

      const creative = await Creative.findByIdAndDelete(creativeId);

      if (!creative) {
        res.status(400).json({
          status: "FAILED",
          message: "Creative not found or already deleted",
        });
        return;
      }

      const creativeImageUrl = creative.creative.image;
      const extractKey = /(?:https:\/\/[a-zA-Z0-9.-]+\/)(.*)/;
      const match = creativeImageUrl.match(extractKey);
      if (match && match[1]) {
        const objKey = match[1];
        await this.deleteObjectFromS3(objKey);
      }

      const objectPromises = creative.creative.objects.map(async (obj: any) => {
        if (obj.type === "Image") {
          const extractKey = /(?:https:\/\/[a-zA-Z0-9.-]+\/)(.*)/;

          const match = obj.src.match(extractKey);

          if (match && match[1]) {
            const objectKey = match[1];
            try {
              await this.deleteObjectFromS3(objectKey);
            } catch (error) {
              console.error(`Failed to delete image: ${objectKey}`, error);
            }
          } else {
            console.warn("No valid object key found for image:", obj.src);
          }
        }
      });

      await Promise.all(objectPromises);

      res.status(200).json({
        status: "SUCCESS",
        message: "Creative deleted successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error deleting creative");
    }
  };

  deleteAllCreatives = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ message: "User is not authenticated" });
        return;
      }

      const creatives = await Creative.find({ userId });

      if (!creatives.length) {
        res.status(400).json({
          status: "FAILED",
          message: "No creatives were found",
        });
        return;
      }

      await this.deleteImagesFromS3(creatives);
      const result = await Creative.deleteMany({ userId });

      if (result.deletedCount === 0) {
        res.status(400).json({
          status: "FAILED",
          message: "No creatives found to delete",
        });
        return;
      }

      res.status(200).json({
        status: "SUCCESS",
        message: "All creatives deleted successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error deleting creatives");
    }
  };

  uploadBase64ToS3 = async (base64String: string, fileName: string) => {
    if (
      !base64String.startsWith("data:image/") ||
      !base64String.includes("base64,")
    ) {
      throw new Error("Invalid base64 image format");
    }

    const base64Data = Buffer.from(base64String.split(",")[1], "base64");

    const mimeType = base64String.match(/data:image\/(.*?);base64,/);

    const contentType = mimeType ? `image/${mimeType[1]}` : "image/png";

    const params = {
      Bucket: process.env.BUCKET_NAME!,
      Key: fileName,
      Body: base64Data,
      ContentType: contentType,
    };

    try {
      const data = await s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  };

  deleteObjectFromS3 = async (objectKey: string) => {
    try {
      const params = {
        Bucket: process.env.BUCKET_NAME!,
        Key: objectKey,
      };

      const data = await s3.deleteObject(params).promise();
    } catch (error) {
      console.error("Error deleting object from S3:", error);
    }
  };

  deleteImagesFromS3 = async (creatives: any[]) => {
    try {
      const mainImagePromises = creatives.map(async (crt: any) => {
        const creativeImageUrl = crt.creative.image;
        const extractKey = /(?:https:\/\/[a-zA-Z0-9.-]+\/)(.*)/;
        const match = creativeImageUrl.match(extractKey);

        if (match && match[1]) {
          const objKey = match[1];
          await this.deleteObjectFromS3(objKey);
        }
      });

      const objectImagePromises = creatives.map(async (creative: any) => {
        creative.creative.objects.map(async (obj: any) => {
          if (obj.type === "Image") {
            const extractKey = /(?:https:\/\/[a-zA-Z0-9.-]+\/)(.*)/;

            const match = obj.src.match(extractKey);

            if (match && match[1]) {
              const objectKey = match[1];
              try {
                await this.deleteObjectFromS3(objectKey);
              } catch (error) {
                console.error(`Failed to delete image: ${objectKey}`, error);
              }
            } else {
              console.warn("No valid object key found for image:", obj.src);
            }
          }
        });
      });

      await Promise.all([...mainImagePromises, ...objectImagePromises]);
    } catch (error) {
      console.log("Something went wrong: ", error);
      throw new Error("An error occured while deleting creatives");
    }
  };
}

export default new CreativeController();
