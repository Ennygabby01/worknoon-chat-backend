import { getPagination } from "../../shared/validation/pagination.js";
import { ConversationModel } from "../conversations/conversation.model.js";
import { UserModel } from "../users/user.model.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AdminConversationListQuery, AdminUpdateUserInput } from "./admin.schemas.js";

export async function listAdminConversations(query: AdminConversationListQuery) {
  const pagination = getPagination(query);
  const filters: Record<string, unknown> = {};

  if (query.type) {
    filters.type = query.type;
  }

  const [conversations, total] = await Promise.all([
    ConversationModel.find(filters)
      .sort({ updatedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    ConversationModel.countDocuments(filters)
  ]);

  return {
    conversations,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total
    }
  };
}

export async function adminUpdateUser(userId: string, input: AdminUpdateUserInput) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (input.role !== undefined) user.role = input.role;
  if (input.banned !== undefined) user.banned = input.banned;
  await user.save();
  return user;
}
