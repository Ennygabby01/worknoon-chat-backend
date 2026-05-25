import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import { userRoles, type UserRole } from "./user-role.js";

export type User = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  ordersCompleted?: number;
  conversationsCount?: number;
  banned: boolean;
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
    bio: {
      type: String,
      trim: true,
      maxlength: 240
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120
    },
    ordersCompleted: {
      type: Number,
      min: 0,
      default: 0
    },
    conversationsCount: {
      type: Number,
      min: 0,
      default: 0
    },
    banned: {
      type: Boolean,
      required: true,
      default: false
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
