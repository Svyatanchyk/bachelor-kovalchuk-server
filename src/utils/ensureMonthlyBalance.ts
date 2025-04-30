import { HydratedDocument } from "mongoose";
import { IUser } from "../models/User";

export async function ensureMonthlyBalance(user: HydratedDocument<IUser>) {
  const now = new Date();

  const nextReset = new Date(user.tokensResetAt);
  nextReset.setUTCMonth(nextReset.getUTCMonth() + 1);

  if (now >= nextReset) {
    user.tokenBalance = 100;
    user.tokensResetAt = nextReset;
    await user.save();
  }
}
