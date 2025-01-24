import { Schema, model } from "mongoose";

interface IUser {
  email: string;
  password: string;
  isVerified: boolean;
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
      required: true,
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = model<IUser>("User", userSchema);

export default User;
