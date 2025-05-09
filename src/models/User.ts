import { Schema, model } from "mongoose";

export interface IUser {
  email: string;
  password: string;
  isVerified: boolean;
  nickname: string;
  role: Role;
  tokenBalance: number;
  tokensResetAt: Date;
  googleId: string;
  provider: "google" | "local";
}

enum Role {
  admin = "ADMIN",
  user = "USER",
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    nickname: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: Object.values(Role), default: Role.user },
    tokenBalance: { type: Number, default: 100 },
    tokensResetAt: { type: Date, default: Date.now },
    googleId: { type: String, required: false },
    provider: { type: String, required: true },
  },
  { timestamps: true }
);

const User = model<IUser>("User", userSchema);

export default User;
