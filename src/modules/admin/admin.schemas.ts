import { z } from "zod";
import { paginationQuerySchema } from "../../shared/validation/pagination.js";
import { conversationTypes } from "../conversations/conversation.model.js";

export const adminConversationListQuerySchema = paginationQuerySchema.extend({
  type: z.enum(conversationTypes).optional()
});

export type AdminConversationListQuery = z.infer<typeof adminConversationListQuerySchema>;
