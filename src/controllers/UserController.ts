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
import { generateNickName } from "../utils/generateNickName";
import { ensureMonthlyBalance } from "../utils/ensureMonthlyBalance";
import Creative from "../models/Creatives";
import CreativeController from "../controllers/CreativeController";

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

      if (user && user.provider === "google") {
        res.status(400).json({
          status: "FAILED",
          message:
            "Аккаунт з такою поштою вже існує. Будьласка Увійдіть відповідним способом.",
        });
        return;
      }

      if (user && user.provider === "local") {
        res.status(400).json({
          status: "FAILED",
          message: "Аккаунт з такою поштую вже існує",
        });
        return;
      }

      const hashedPassword = await hashString(password);
      const nickname = generateNickName();

      const newUser = new User({
        password: hashedPassword,
        email,
        nickname,
        provider: "local",
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

      if (user.provider === "google") {
        res.status(400).json({
          status: "FAILED",
          message: "Будьласка увійдіть через google",
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

      await ensureMonthlyBalance(user);

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
        provider,
      } = user;

      res.status(200).json({
        status: "SUCCESS",
        message: "Sign in is successfull",
        accessToken,
        user: {
          userId,
          userEmail,
          tokenBalance,
          nickname,
          provider,
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

  updateUser = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { nickname } = req.body;

      if (!nickname) {
        res.status(400).json({
          status: "FAILED",
          message: "Nickname is required",
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(401).json({
          status: "FAILED",
          message: "User not found",
          isAuthenticated: false,
        });
        return;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { nickname },
        { new: true }
      );

      if (!updatedUser) {
        res.status(400).json({
          status: "FAILED",
          message: "Failed to update user",
        });
        return;
      }

      res.status(200).json({
        status: "SUCCESS",
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        status: "FAILED",
        message: "Internal server error",
      });
    }
  };

  changeUserPassword = async (req: AuthRequest, res: Response) => {
    const { newPassword, oldPassword } = req.body;
    const userId = req.user?.userId;

    try {
      if (!userId) {
        res.status(401).json({
          status: "FAILED",
          message: "User is not authorized",
        });
        return;
      }

      if (!newPassword || !oldPassword) {
        res.status(400).json({
          status: "FAILED",
          message: "New password and old password fields are required",
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          status: "FAILED",
          message: "User was not found",
        });
        return;
      }

      const userHashPassword = user.password;
      const isMatch = await compareHashString(oldPassword, userHashPassword);

      if (!isMatch) {
        res.status(400).json({
          status: "FAILED",
          message: "Incorrect input password",
        });
        return;
      }

      const hashedPassword = await hashString(newPassword);

      user.password = hashedPassword;
      await user.save();

      res.status(200).json({
        status: "SUCCESS",
        message: "User password has been updated successfully",
      });
    } catch (error) {
      console.error("Error during changing user password: ", error);
      res.status(500).json({
        status: "FAILED",
        message: "An internal server error occurred. Please try again later.",
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

      const user = await User.findById(userId);
      if (!user) {
        res.status(400).json({
          status: "FAILED",
          message: "User not found",
        });
        return;
      }
      const { email: userEmail, tokenBalance, nickname, provider } = user;

      res.status(200).json({
        status: "SUCCESS",
        isExpired: false,
        message: "Email verified successfully! You can now log in.",
        accessToken,
        user: {
          userId,
          userEmail,
          tokenBalance,
          nickname,
          provider,
        },
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
        isAuthenticated: false,
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

  withdrawCredits = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { price } = req.body;

      if (typeof price !== "number" || price <= 0) {
        return res.status(400).json({
          status: "FAILED",
          message: "Invalid price",
        });
      }

      if (!userId) {
        res.status(401).json({
          status: "FAILED",
          message: "User not found",
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(401).json({
          status: "FAILED",
          message: "User not found",
        });
        return;
      }

      const updatedUser = await User.findOneAndUpdate(
        {
          _id: userId,
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
        tokenBalance: updatedUser?.tokenBalance,
      });
    } catch (error) {
      res.status(500).json({
        status: "FAILED",
      });
      console.error("Error:", error);
    }
  };

  deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { password } = req.body;

      if (!userId) {
        res.status(401).json({
          status: "FAILED",
          message: "Unauthorized: Missing user ID",
        });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        res.status(401).json({
          status: "FAILED",
          message: "User is not authorized",
        });
        return;
      }

      if (user.provider === "local") {
        const isMatch = await compareHashString(password, user.password);
        if (!isMatch) {
          res.status(403).json({
            status: "FAILED",
            message: "Incorect password",
          });
          return;
        }
      }

      const creatives = await Creative.find({ userId });

      if (creatives.length) {
        await CreativeController.deleteImagesFromS3(creatives);
        await Creative.deleteMany({ userId });
      }

      await User.findByIdAndDelete(userId);

      res.status(200).json({
        status: "SUCCESS",
        message: "Account and related data deleted successfully",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({
        status: "FAILED",
        message: "Server error during account deletion",
      });
    }
  };
}

export default new UserController();
