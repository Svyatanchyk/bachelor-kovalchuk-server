import { Request, Response } from "express";
import User from "../models/User";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, generateRefreshToken } from "../utils/token";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);

class GoogleAuthController {
  auth = async (req: Request, res: Response) => {
    const { idToken } = req.body;

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        res.status(401).json({ message: "Invalid token" });
        return;
      }

      const { sub: googleId, email, name } = payload;

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          googleId,
          email,
          nickname: name,
          isVerified: true,
          provider: "google",
        });
      }

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const {
        _id: userId,
        email: userEmail,
        tokenBalance,
        nickname,
        role,
        provider,
      } = user;

      res.status(200).json({
        message: "Logged in",
        user: {
          userId,
          email: userEmail,
          tokenBalance,
          nickname,
          role,
          provider,
        },
        accessToken,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Google auth failed" });
    }
  };
}

export default new GoogleAuthController();
