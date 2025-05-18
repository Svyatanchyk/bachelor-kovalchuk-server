import { Request, Response } from "express";
import User from "../models/User";
import { generateAccessToken, generateRefreshToken } from "../utils/token";
import axios from "axios";

class GoogleAuthController {
  authCode = async (req: Request, res: Response) => {
    const { code } = req.body;

    console.log("Code: ", code);

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    try {
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        null,
        {
          params: {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token } = tokenResponse.data;

      const profileResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const payload = profileResponse.data;

      const { id, email, name } = payload;

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          googleId: id,
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
      console.error("Google OAuth failed: ", error);
      res.status(500).json({ error: "Failed to authenticate with Google" });
    }
  };
}

export default new GoogleAuthController();
