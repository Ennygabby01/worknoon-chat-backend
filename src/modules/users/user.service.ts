import { AppError } from "../../shared/errors/app-error.js";
import { getPagination } from "../../shared/validation/pagination.js";
import { UserModel, type UserDocument } from "./user.model.js";
import type { UpdateProfileInput, UserListQuery } from "./user.schemas.js";

export async function updateUserProfile(user: UserDocument, input: UpdateProfileInput) {
  if (input.name !== undefined) {
    user.name = input.name;
  }

  if (input.avatarUrl !== undefined) {
    user.avatarUrl = input.avatarUrl ?? undefined;
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

export function assertUserLoaded(user: UserDocument | undefined) {
  if (!user) {
    throw new AppError("Authentication is required", 401, "AUTH_REQUIRED");
  }

  return user;
}
