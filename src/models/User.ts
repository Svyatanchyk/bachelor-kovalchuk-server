import { Schema, model } from "mongoose";

interface IUser {
  email: string;
  password: string;
  isVerified: boolean;
  role: Role;
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
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: Object.values(Role), default: Role.user },
  },
  { timestamps: true }
);

const User = model<IUser>("User", userSchema);

export default User;
