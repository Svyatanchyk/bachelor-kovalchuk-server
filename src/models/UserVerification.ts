import { Schema, model, Types } from "mongoose";

interface IUserVerification {
  userId: Types.ObjectId;
  uniqueString: string;
  expiresAt: Date;
}

const userVerificationSchema = new Schema<IUserVerification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uniqueString: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const UserVerification = model<IUserVerification>(
  "UserVerification",
  userVerificationSchema
);

export default UserVerification;
