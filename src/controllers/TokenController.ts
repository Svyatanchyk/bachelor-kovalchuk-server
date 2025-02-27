import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { generateAccessToken } from "../utils/token";

interface IDecodedUser {
  userId: string;
}

class TokenController {
  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res
        .status(401)
        .json({ status: "FAILED", message: "No refresh token provided" });
      return;
    }

    try {
      const decodedUser = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      ) as IDecodedUser;

      if (!decodedUser) {
        res.status(403).json({ error: "Invalid refresh token" });
        return;
      }

      const newAccessToken = generateAccessToken(decodedUser.userId);
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      console.log("Error refresh access token: ", error);
      res.status(403).json({
        status: "FAILED",
        message: "Invalid or expired refresh token",
      });
      return;
    }
  };
}

export default new TokenController();
