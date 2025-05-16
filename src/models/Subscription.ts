import { Schema, model, Types } from "mongoose";

export interface ISubscription {
  userId: Types.ObjectId;
  status: "active" | "expired";
  startDate: Date;
  endDate: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired"],
      required: true,
    },
    startDate: {
      type: Date,
      default: () => new Date(),
    },
    endDate: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setMonth(now.getMonth() + 1);
        return now;
      },
    },
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>(
  "Subscription",
  subscriptionSchema
);
