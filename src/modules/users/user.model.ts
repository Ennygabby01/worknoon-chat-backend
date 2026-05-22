import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import { userRoles, type UserRole } from "./user-role.js";

export type User = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  emailVerifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 160
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: userRoles,
      required: true,
      default: "customer"
    },
    avatarUrl: {
      type: String,
      trim: true,
      maxlength: 500
    },
    emailVerifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel: Model<User> = model<User>("User", userSchema);
