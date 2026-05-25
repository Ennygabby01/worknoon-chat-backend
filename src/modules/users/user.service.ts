import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/app-error.js";
import { getPagination } from "../../shared/validation/pagination.js";
import { UserModel, type UserDocument } from "./user.model.js";
import type { ChangePasswordInput, ContactListQuery, UpdateProfileInput, UserListQuery } from "./user.schemas.js";

export async function updateUserProfile(user: UserDocument, input: UpdateProfileInput) {
  if (input.name !== undefined) {
    user.name = input.name;
  }

  if (input.avatarUrl !== undefined) {
    user.avatarUrl = input.avatarUrl ?? undefined;
  }

  if (input.bio !== undefined) {
    user.bio = input.bio ?? undefined;
  }

  if (input.location !== undefined) {
    user.location = input.location ?? undefined;
  }

  await user.save();

  return user;
}

export async function listUsers(query: UserListQuery) {
  const pagination = getPagination(query);
  const filters: Record<string, unknown> = {};

  if (query.role) {
    filters.role = query.role;
  }

  if (query.search) {
    filters.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } }
    ];
  }

  const [users, total] = await Promise.all([
    UserModel.find(filters)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    UserModel.countDocuments(filters)
  ]);

  return {
    users,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total
    }
  };
}

export async function listChatContacts(currentUserId: string, query: ContactListQuery) {
  const pagination = getPagination(query);
  const filters: Record<string, unknown> = {
    _id: { $ne: currentUserId },
    role: query.role ?? { $ne: "admin" },
    emailVerifiedAt: { $exists: true }
  };

  if (query.search) {
    filters.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } }
    ];
  }

  const [users, total] = await Promise.all([
    UserModel.find(filters)
      .sort({ role: 1, name: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    UserModel.countDocuments(filters)
  ]);

  return {
    users,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total
    }
  };
}

export async function changeUserPassword(userId: string, input: ChangePasswordInput) {
  const user = await UserModel.findById(userId).select("+passwordHash");
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matches) throw new AppError("Current password is incorrect", 400, "INVALID_PASSWORD");

  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  await user.save();
}

export function assertUserLoaded(user: UserDocument | undefined) {
  if (!user) {
    throw new AppError("Authentication is required", 401, "AUTH_REQUIRED");
  }

  return user;
}
