import { Schema, model, type Model, type Types } from "mongoose";

export const accountActionTokenTypes = ["email_verification", "password_reset"] as const;

export type AccountActionTokenType = (typeof accountActionTokenTypes)[number];

export type AccountActionToken = {
  userId: Types.ObjectId;
  type: AccountActionTokenType;
  tokenHash: string;
  codeHash?: string;
  expiresAt: Date;
  consumedAt?: Date;
};

const accountActionTokenSchema = new Schema<AccountActionToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: accountActionTokenTypes,
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    codeHash: {
      type: String
    },
    expiresAt: {
      type: Date,
      required: true
    },
    consumedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

accountActionTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AccountActionTokenModel: Model<AccountActionToken> =
  model<AccountActionToken>("AccountActionToken", accountActionTokenSchema);
