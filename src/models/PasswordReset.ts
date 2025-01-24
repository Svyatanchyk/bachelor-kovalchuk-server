import { Schema, model, Types } from "mongoose";

interface IPasswordReset {
  userId: Types.ObjectId;
  resetString: string;
  expiresAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resetString: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const PasswordReset = model<IPasswordReset>(
  "PasswordReset",
  passwordResetSchema
);

export default PasswordReset;
