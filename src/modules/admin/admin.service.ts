import { getPagination } from "../../shared/validation/pagination.js";
import { ConversationModel } from "../conversations/conversation.model.js";
import type { AdminConversationListQuery } from "./admin.schemas.js";

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
