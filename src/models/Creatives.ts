import { Schema, model } from "mongoose";

export interface ICreative {
  userId: string;
  creative: any[];
}

const creativeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  creatives: {
    type: [Schema.Types.Mixed],
  },
});

const Creative = model("Creative", creativeSchema);

export default Creative;
