import { Schema, model, type Model, type Types } from "mongoose";

export type RefreshSession = {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
};

const refreshSessionSchema = new Schema<RefreshSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSessionModel: Model<RefreshSession> = model<RefreshSession>(
  "RefreshSession",
  refreshSessionSchema
);
