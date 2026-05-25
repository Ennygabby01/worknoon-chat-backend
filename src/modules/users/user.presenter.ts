import type { Types } from "mongoose";
import type { User, UserDocument } from "./user.model.js";

type PresentableUser = User & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export function presentUser(user: UserDocument | PresentableUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    location: user.location ?? null,
    ordersCompleted: user.ordersCompleted ?? 0,
    conversationsCount: user.conversationsCount ?? 0,
    banned: user.banned ?? false,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString()
  };
}
