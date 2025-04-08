import { Request, Response } from "express";
import User from "../models/User";
import UserVerification from "../models/UserVerification";
import PasswordReset from "../models/PasswordReset";
import { compareHashString, hashString } from "../utils/hashing";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "../utils/emailSender";
import { generateUniqueString } from "../utils/uniqueStringGenerator";
import dotenv from "dotenv";

import {
  RESETING_PASSWORD_EXPIRATION_TIME,
  VERIFICATION_EXPIRATION_TIME,
} from "../constants/verificationLink";
import { generateAccessToken, generateRefreshToken } from "../utils/token";

dotenv.config();

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

class UserController {
  signup = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (user) {
        res.status(400).json({
          status: "FAILED",
          message: "User with the provided email already exists",
        });
        return;
      }

      const hashedPassword = await hashString(password);
      const newUser = new User({
        password: hashedPassword,
        email,
      });

      await newUser.save();

      await this.createVerificationEntry(newUser);
      res.status(201).json({
        status: "SUCCESS",
        message:
          "Check your inbox to verify your account in order to login into your account",
      });
    } catch (error) {
      console.error("Error during signup:", error);

      res.status(500).json({
        status: "FAILED",
        message: "An internal server error occurred, please try again later",
      });
    }
  };

  signin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        res.status(400).json({
          status: "FAILED",
          message: "Incorect email or password",
        });
        return;
      }

      if (!user.isVerified) {
        res.status(400).json({
          status: "FAILED",
          message:
            "Email has not been verified yet. Please verify your email first",
        });
        return;
      }

      const isMatch = await compareHashString(password, user.password);

      if (!isMatch) {
        res.status(400).json({
          status: "FAILED",
          message: "Incorect email or password",
        });
        return;
      }

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "SUCCESS",
        message: "Sign in is successfull",
        accessToken,
        data: {
          userId: user._id,
        },
      });
    } catch (error) {
      console.error("Error during signin:", error);
      res.status(500).json({
        status: "FAILED",
        message: "An internal server error occurred",
      });
    }
  };

  verifySignup = async (req: Request, res: Response) => {
    const { userId, uniqueString } = req.params;

    try {
      const verificationEntry = await UserVerification.findOne({ userId });

      if (!verificationEntry) {
        res.status(400).json({
          status: "FAILED",
          isExpired: false,
          message:
            "This link is not valid now. Account has been verified already.",
        });
        return;
      }

      if (verificationEntry.expiresAt < new Date()) {
        await UserVerification.deleteOne({ userId });
        res.status(400).json({
          status: "FAILED",
          isExpired: true,
          message: "Verification link has expired. But you can regenerate it.",
        });
        return;
      }

      const isMatch = await compareHashString(
        uniqueString,
        verificationEntry.uniqueString
      );

      if (!isMatch) {
        res.status(400).json({
          status: "FAILED",
          isExpired: true,
          message: "Invalid verification link",
        });
        return;
      }

      await User.updateOne({ _id: userId }, { isVerified: true });
      await UserVerification.deleteOne({ userId });

      const accessToken = generateAccessToken(userId.toString());
      const refreshToken = generateRefreshToken(userId.toString());

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "SUCCESS",
        isExpired: false,
        message: "Email verified successfully! You can now log in.",
        accessToken,
      });
    } catch (error) {
      console.error(`Error during verification for userId: ${userId}`, error);
      res.status(500).json({
        status: "FAILED",
        message: "An internal server error occurred. Please try again later.",
      });
    }
  };

  regenerateVerificationLink = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      const user = await User.findOne({ _id: userId });
      if (!user) {
        res.status(400).json({
          status: "FAILED",
          message: "User not found, please sign up again",
        });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({
          status: "FAILED",
          message: "User is already verified, please sign in",
        });
        return;
      }

      const userVerification = await UserVerification.findOne({ userId });

      if (userVerification) {
        res.status(400).json({
          message:
            "You can not regenerate the verification link, please check your inbox",
        });
        return;
      }

      await this.createVerificationEntry(user, res);
    } catch (error) {
      console.error(
        "Error during regenerating the user verification link:",
        error
      );

      res.status(500).json({
        status: "FAILED",
        message: "An internal server error occurred",
      });
    }
  };

  private createVerificationEntry = async (user: any, res?: Response) => {
    const uniqueString = generateUniqueString(user._id.toString());
    const verificationLink = `${process.env.FRONTEND_BASE_URL}/user/verify/${user._id}/${uniqueString}`;

    const hashedUniqueString = await hashString(uniqueString);
    const newVerification = new UserVerification({
      userId: user._id,
      uniqueString: hashedUniqueString,
      expiresAt: new Date(Date.now() + VERIFICATION_EXPIRATION_TIME),
    });

    await newVerification.save();

    await sendVerificationEmail(user.email, verificationLink);

    if (!res) return;

    res.status(200).json({
      status: "SUCCESS",
      message:
        "Verification link has been sent to your email. Please verify your email to login",
    });
  };

  requestResetPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        res.status(400).json({
          status: "FAILED",
          message: "No account with the supplied email exists",
        });
        return;
      }

      if (!user.isVerified) {
        res.status(400).json({
          status: "FAILED",
          message:
            "Email has not been verified yet. Please verify your email first",
        });
        return;
      }

      const resetString = generateUniqueString(user._id.toString());
      await PasswordReset.deleteMany({ userId: user._id });

      const resetPasswordLink = `${process.env.FRONTEND_BASE_URL}/reset-password/${user._id}/${resetString}`;
      const hashedResetPasswordString = await hashString(resetString);

      const newPasswordReset = new PasswordReset({
        userId: user._id,
        resetString: hashedResetPasswordString,
        expiresAt: new Date(Date.now() + RESETING_PASSWORD_EXPIRATION_TIME),
      });

      await newPasswordReset.save();

      await sendResetPasswordEmail(user.email, resetPasswordLink);

      res.status(200).json({
        status: "SUCCESS",
        message: "Password reset link has been sent to your email.",
      });
    } catch (error) {
      console.error(
        "Error during reseting the password for user with email:",
        error
      );

      res.status(500).json({
        status: "FAILED",
        message: "An internal server error occurred",
      });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    const { userId, resetString, newPassword } = req.body;

    try {
      const passwordResetRecord = await PasswordReset.findOne({
        userId,
      });

      if (!userId || !resetString || !newPassword) {
        res.status(400).json({
          status: "FAILED",
          message: "All fields (userId, resetString, newPassword) are required",
        });
        return;
      }

      if (!passwordResetRecord) {
        res.status(400).json({
          status: "FAILED",
          message: "Reset request not found. Please request a new reset link.",
        });
        return;
      }

      if (passwordResetRecord.expiresAt < new Date()) {
        await PasswordReset.deleteOne({ userId });
        res.status(400).json({
          status: "FAILED",
          message: "Reset password link has expired. Please request again.",
        });
        return;
      }

      const isMatch = await compareHashString(
        resetString,
        passwordResetRecord.resetString
      );

      if (!isMatch) {
        res.status(400).json({
          status: "FAILED",
          message: "Invalid reset password link, please request again",
        });
        return;
      }

      const hashedPassword = await hashString(newPassword);
      await User.updateOne({ _id: userId }, { password: hashedPassword });
      await PasswordReset.deleteOne({ userId });

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Password reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      console.error(`Error during password reset for userId: ${userId}`, error);

      res.status(500).json({
        status: "FAILED",
        message: "An internal server error occurred",
      });
    }
  };

  authMe = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({
        status: "FAILED",
        message: "User not found",
      });
      return;
    }

    const { password, ...userData } = user?.toObject() || {};

    res.status(200).json({
      user: userData,
      isAuthenticated: true,
    });
  };

  logout = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: "FAILED",
        message: "User not found",
      });
      return;
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      status: "SUCCESS",
      message: "Logged out successfully",
    });
  };
}

export default new UserController();
